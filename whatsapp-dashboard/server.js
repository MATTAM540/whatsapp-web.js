import { createServer } from "node:http";
import next from "next";

import { Server } from "socket.io";
import { startWhatsAppService } from "./src/lib/whatsapp-client.js";
import { processScheduledMessages } from "./src/lib/automation.js";


const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// Initialize the Next.js app
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(handler);

    // Initialize Socket.io
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    // Basic connection log
    io.on("connection", (socket) => {
        console.log("Client connected via Socket.io:", socket.id);

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    // Start WhatsApp Service
    startWhatsAppService(io);

    // Automation Check Loop (Runs every minute)
    setInterval(() => {
        processScheduledMessages().catch(console.error);
    }, 60000);

    // Error handling for HTTP server
    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
