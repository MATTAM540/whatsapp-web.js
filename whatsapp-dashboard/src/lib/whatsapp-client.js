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

export function startWhatsAppService(io) {
    ioInstance = io;
    globalThis.socketIO = io;

    // Emits current status to all connected socket clients
    const broadcastStatus = () => {
        ioInstance?.emit("wa_status", { status: globalThis.waClientStatus, qr: qrCodeData });
    };

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

    globalThis.waClient.on('ready', async () => {
        console.log('CLIENT IS READY');
        globalThis.waClientStatus = "READY";
        broadcastStatus();

        // Initial Data Sync - Only sync chat metadata, NOT messages
        syncInitialData().catch(err => console.error("Sync Error:", err));
    });

    async function syncInitialData() {
        console.log("Starting Initial Data Sync (chats only, no messages)...");
        try {
            const chats = await globalThis.waClient.getChats();
            console.log(`Found ${chats.length} chats to sync.`);

            for (const chat of chats.slice(0, 30)) { // Sync up to 30 recent chat metadata
                // Resolve the best name for this chat
                let chatName = chat.name;
                if (!chat.isGroup) {
                    try {
                        const contact = await chat.getContact();
                        chatName = contact.name || contact.pushname || contact.shortName || chat.name;
                    } catch (e) {
                        // Fallback to chat.name if getContact fails
                    }
                }

                // Get last message text for chat list display
                let lastMsgText = "";
                let lastMsgTimestamp = new Date();
                try {
                    const lastMessages = await chat.fetchMessages({ limit: 1 });
                    if (lastMessages.length > 0) {
                        lastMsgText = lastMessages[0].body || "";
                        lastMsgTimestamp = new Date(lastMessages[0].timestamp * 1000);
                    }
                } catch (e) {
                    // Ignore
                }

                let dbChat = await db.chat.findUnique({ where: { whatsappId: chat.id._serialized } });

                if (!dbChat) {
                    dbChat = await db.chat.create({
                        data: {
                            whatsappId: chat.id._serialized,
                            name: chatName,
                            isGroup: chat.isGroup,
                            unreadCount: chat.unreadCount,
                            lastMessage: lastMsgText,
                            lastTimestamp: lastMsgTimestamp
                        }
                    });
                } else {
                    // Update name and last message
                    const updateData = {
                        lastMessage: lastMsgText,
                        lastTimestamp: lastMsgTimestamp
                    };
                    if (chatName && chatName !== dbChat.name) {
                        updateData.name = chatName;
                    }
                    await db.chat.update({
                        where: { id: dbChat.id },
                        data: updateData
                    });
                }
            }

            // Update stats (use counts from WhatsApp, not DB messages)
            const chatCount = await db.chat.count();
            let existingStats = await db.systemStat.findFirst();
            if (existingStats) {
                await db.systemStat.update({
                    where: { id: existingStats.id },
                    data: { activeChats: chatCount }
                });
            } else {
                await db.systemStat.create({
                    data: {
                        messagesSent: 0,
                        messagesRcvd: 0,
                        activeChats: chatCount
                    }
                });
            }

            console.log("Initial Sync Complete! (Chat metadata only)");
            ioInstance?.emit("sync_complete");
        } catch (err) {
            console.error("Failed to sync initial data:", err);
        }
    }


    globalThis.waClient.on('disconnected', (reason) => {
        console.log('Client was logged out', reason);
        globalThis.waClientStatus = "DISCONNECTED";
        qrCodeData = null;
        broadcastStatus();
    });

    globalThis.waClient.on('message', async (msg) => {
        try {
            const chat = await msg.getChat();
            const contact = await msg.getContact();

            // Resolve best name
            const chatName = chat.isGroup
                ? chat.name
                : (contact.name || contact.pushname || contact.shortName || contact.number);

            // Resolve sender name for group messages
            let senderName = null;
            if (chat.isGroup && msg.author) {
                try {
                    const senderContact = await globalThis.waClient.getContactById(msg.author);
                    senderName = senderContact.name || senderContact.pushname || senderContact.shortName || senderContact.number;
                } catch (e) {
                    senderName = contact.name || contact.pushname || contact.number;
                }
            }

            // Update chat metadata in DB (NOT the message itself)
            let dbChat = await db.chat.findUnique({ where: { whatsappId: chat.id._serialized } });
            if (!dbChat) {
                dbChat = await db.chat.create({
                    data: {
                        whatsappId: chat.id._serialized,
                        name: chatName,
                        isGroup: chat.isGroup,
                        unreadCount: chat.unreadCount,
                        lastMessage: msg.body,
                        lastTimestamp: new Date(msg.timestamp * 1000)
                    }
                });
            } else {
                const updateData = {
                    unreadCount: { increment: 1 },
                    lastMessage: msg.body,
                    lastTimestamp: new Date(msg.timestamp * 1000)
                };
                if (chatName && chatName !== dbChat.name && !/^\d+$/.test(chatName)) {
                    updateData.name = chatName;
                }
                await db.chat.update({
                    where: { id: dbChat.id },
                    data: updateData
                });
                if (updateData.name) {
                    dbChat = { ...dbChat, name: updateData.name };
                }
            }

            // Update stats
            await db.systemStat.updateMany({
                data: { messagesRcvd: { increment: 1 } }
            });

            // Emit to UI (send the message directly via socket, no DB storage)
            const messageForUI = {
                id: msg.id._serialized,
                messageId: msg.id._serialized,
                text: msg.body,
                fromMe: msg.fromMe,
                senderName,
                timestamp: new Date(msg.timestamp * 1000).toISOString(),
                status: "RECEIVED"
            };

            ioInstance?.emit("incoming_message", { chat: dbChat, message: messageForUI });

            // Run automation rules
            await handleAutoReply(msg);
        } catch (error) {
            console.error("Error handling incoming message:", error);
        }
    });

    globalThis.waClient.on('message_create', async (msg) => {
        if (msg.fromMe) {
            try {
                const chat = await msg.getChat();
                let dbChat = await db.chat.findUnique({ where: { whatsappId: chat.id._serialized } });
                if (dbChat) {
                    await db.chat.update({
                        where: { id: dbChat.id },
                        data: {
                            lastMessage: msg.body,
                            lastTimestamp: new Date(msg.timestamp * 1000)
                        }
                    });

                    await db.systemStat.updateMany({
                        data: { messagesSent: { increment: 1 } }
                    });

                    const messageForUI = {
                        id: msg.id._serialized,
                        messageId: msg.id._serialized,
                        text: msg.body,
                        fromMe: true,
                        senderName: 'Sen',
                        timestamp: new Date(msg.timestamp * 1000).toISOString(),
                        status: "SENT"
                    };

                    ioInstance?.emit("sent_message", { chat: dbChat, message: messageForUI });
                }
            } catch (err) {
                console.error("Error handling outgoing message sync:", err);
            }
        }
    });

    // Handle ACK (Read receipts) - emit via socket only
    globalThis.waClient.on('message_ack', async (msg, ack) => {
        try {
            let status = "SENT";
            if (ack === 2) status = "DELIVERED";
            if (ack === 3) status = "READ";

            ioInstance?.emit("message_ack", {
                messageId: msg.id._serialized,
                status
            });
        } catch (e) {
            // Ignore
        }
    });

    // Export io connection handler specifically for WA events
    io.on("connection", (socket) => {
        // Send immediate status on connect
        socket.emit("wa_status", { status: globalThis.waClientStatus, qr: qrCodeData });

        // Command listener
        socket.on("wa_command", async (data) => {
            if (data.command === "logout" && globalThis.waClient) {
                await globalThis.waClient.logout();
            }
        });

        // Send a message triggered from UI
        socket.on("send_message", async (data) => {
            try {
                if (!globalThis.waClient || globalThis.waClientStatus !== "READY") return;
                const { to, text } = data; // to = whatsappId
                const sentMsg = await globalThis.waClient.sendMessage(to, text);

                // Note: The message_create locally will pick this up and emit to UI
                socket.emit("send_message_success", { to, id: sentMsg.id._serialized });
            } catch (err) {
                console.error("Error sending message via Socket:", err);
                socket.emit("send_message_error", { error: err.message });
            }
        });
    });

    globalThis.waClient.initialize().catch(err => {
        console.error("WhatsApp Initialization Error:", err);
    });
}

// Helper to access the client outside of initialization
export const getClient = () => globalThis.waClient;
export const getStatus = () => globalThis.waClientStatus;
