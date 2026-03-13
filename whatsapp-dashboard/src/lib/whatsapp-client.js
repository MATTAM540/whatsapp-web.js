import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode";
import { db } from "./db.js";
import { handleAutoReply } from "./automation.js";

// Use globalThis to share client instance across Next.js and custom server
if (!globalThis.waClient) {
    globalThis.waClient = null;
    globalThis.waClientStatus = "DISCONNECTED"; // DISCONNECTED, QR_READY, AUTHENTICATED, READY
}

let ioInstance = null;
let qrCodeData = null;

const broadcastStatus = () => {
    if (globalThis.socketIO) {
        globalThis.socketIO.emit("wa_status", { status: globalThis.waClientStatus, qr: qrCodeData });
    }
};

async function destroyClient() {
    if (globalThis.waClient) {
        console.log("Destroying existing WhatsApp client...");
        try {
            await globalThis.waClient.destroy();
        } catch (err) {
            console.error("Error destroying client:", err);
        }
        globalThis.waClient = null;
    }
}

export async function initWhatsAppClient() {
    await destroyClient();

    console.log("Initializing WhatsApp Client...");
    globalThis.waClientStatus = "DISCONNECTED";
    qrCodeData = null;
    broadcastStatus();

    globalThis.waClient = new Client({
        authStrategy: new LocalAuth({
            clientId: "wa-dashboard-session"
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ],
        }
    });

    globalThis.waClient.on('qr', async (qr) => {
        console.log('QR RECEIVED');
        globalThis.waClientStatus = "QR_READY";
        try {
            qrCodeData = await qrcode.toDataURL(qr);
            broadcastStatus();
        } catch (err) {
            console.error("Failed to generate QR Data URL", err);
        }
    });

    globalThis.waClient.on('authenticated', () => {
        console.log('AUTHENTICATED');
        globalThis.waClientStatus = "AUTHENTICATED";
        qrCodeData = null;
        broadcastStatus();
    });

    globalThis.waClient.on('ready', () => {
        console.log('CLIENT IS READY');
        globalThis.waClientStatus = "READY";
        broadcastStatus();
    });

    globalThis.waClient.on('disconnected', async (reason) => {
        console.log('Client was logged out or disconnected:', reason);
        globalThis.waClientStatus = "DISCONNECTED";
        qrCodeData = null;
        broadcastStatus();
        
        // Auto-reinitialize to get a new QR code if it was a logout or critical failure
        console.log("Restarting client in 5 seconds...");
        setTimeout(() => initWhatsAppClient(), 5000);
    });

    // Handle incoming messages for Auto-Reply
    globalThis.waClient.on('message', async (msg) => {
        try {
            await handleAutoReply(msg);
        } catch (error) {
            console.error("Error handling incoming message:", error);
        }
    });

    // Handle incoming calls to Auto-Reject
    globalThis.waClient.on('call', async (call) => {
        try {
            const setting = await db.appSetting.findUnique({
                where: { key: "autoRejectCalls" }
            });

            if (setting && setting.value === "true") {
                console.log(`Rejecting call from ${call.from}`);
                await call.reject();
            }
        } catch (error) {
            console.error("Error handling call rejection:", error);
        }
    });

    globalThis.waClient.initialize().catch(err => {
        console.error("WhatsApp Initialization Error:", err);
        globalThis.waClientStatus = "DISCONNECTED";
        broadcastStatus();
    });
}

export function startWhatsAppService(io) {
    ioInstance = io;
    globalThis.socketIO = io;

    io.on("connection", (socket) => {
        socket.emit("wa_status", { status: globalThis.waClientStatus, qr: qrCodeData });

        socket.on("wa_command", async (data) => {
            console.log("Received command:", data.command);
            if (data.command === "logout" && globalThis.waClient) {
                try {
                    console.log("Attempting logout...");
                    await globalThis.waClient.logout();
                    console.log("Logout successful");
                } catch (err) {
                    console.error("Logout failed, forcing destruction:", err);
                    await destroyClient();
                    initWhatsAppClient();
                }
            } else if (data.command === "restart") {
                initWhatsAppClient();
            }
        });

        // Useful for bulk sending from frontend if needed via socket
        socket.on("send_message", async (data) => {
            try {
                if (!globalThis.waClient || globalThis.waClientStatus !== "READY") return;
                const { to, text } = data;
                await globalThis.waClient.sendMessage(to, text);
            } catch (err) {
                console.error("Error sending message via Socket:", err);
            }
        });
    });

    // Initial boot
    initWhatsAppClient();
}

// Helper to access the client outside of initialization
export const getClient = () => globalThis.waClient;
export const getStatus = () => globalThis.waClientStatus;
