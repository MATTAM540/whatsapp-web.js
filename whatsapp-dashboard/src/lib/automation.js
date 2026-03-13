import { db } from "./db.js";
import { getClient, getStatus } from "./whatsapp-client.js";

// Hook this up inside whatsapp-client.js on every incoming message
export async function handleAutoReply(msg) {
    if (msg.fromMe || msg.from.endsWith('@g.us')) return;

    try {
        const rules = await db.autoReplyRule.findMany({
            where: { isActive: true }
        });

        for (const rule of rules) {
            let shouldReply = false;

            if (rule.triggerType === "ALWAYS") {
                shouldReply = true;
            } else if (rule.triggerType === "EXACT_MATCH" && msg.body === rule.keyword) {
                shouldReply = true;
            } else if (rule.triggerType === "CONTAINS" && msg.body.includes(rule.keyword)) {
                shouldReply = true;
            }

            if (shouldReply) {
                const client = getClient();
                if (client) {
                    await client.sendMessage(msg.from, rule.replyText);
                    // Since it creates a message_create event, it will log itself into the DB automatically
                    break; // Only trigger one rule per message
                }
            }
        }
    } catch (err) {
        console.error("Error in AutoReply logic:", err);
    }
}

// Run this every minute via setInterval in server.js
export async function processScheduledMessages() {
    const client = getClient();
    const status = getStatus();
    if (!client || status !== "READY") return;

    try {
        const now = new Date();
        const pendingMsgs = await db.scheduledMessage.findMany({
            where: {
                status: "PENDING",
                sendAt: { lte: now } // DB stores UTC, now is UTC — direct comparison works
            }
        });

        if (pendingMsgs.length > 0) {
            console.log(`[Scheduler] Processing ${pendingMsgs.length} scheduled message(s)...`);
        }

        for (let i = 0; i < pendingMsgs.length; i++) {
            const msg = pendingMsgs[i];
            
            // Wait for random delay (except for the first one if you want, but better to always delay if it's a batch)
            // To match bulk send behavior: delay before each message if it's not the first ONE in this batch
            if (i > 0) {
                const min = msg.minDelay || 2;
                const max = msg.maxDelay || 5;
                const delay = Math.floor(Math.random() * (max - min + 1) + min) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            try {
                await client.sendMessage(msg.toPhone, msg.text);

                await db.scheduledMessage.update({
                    where: { id: msg.id },
                    data: { status: "SENT" }
                });
                console.log(`[Scheduler] ✓ Sent scheduled message ${msg.id} to ${msg.toPhone}`);
            } catch (sendErr) {
                console.error(`[Scheduler] ✗ Failed to send scheduled msg ${msg.id}:`, sendErr);
                await db.scheduledMessage.update({
                    where: { id: msg.id },
                    data: { status: "FAILED" }
                });
            }
        }
    } catch (err) {
        console.error("[Scheduler] Error processing scheduled messages:", err);
    }
}
