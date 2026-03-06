import { db } from "./db.js";
import { getClient } from "./whatsapp-client.js";

// Hook this up inside whatsapp-client.js on every incoming message
export async function handleAutoReply(msg) {
    if (msg.fromMe) return;

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
    if (!client) return;

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

        for (const msg of pendingMsgs) {
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
