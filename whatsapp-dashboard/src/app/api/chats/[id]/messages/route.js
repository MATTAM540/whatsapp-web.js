import { NextResponse } from 'next/server';
import { getClient, getStatus } from '@/lib/whatsapp-client';
import { db } from '@/lib/db';

export async function GET(request, { params }) {
    try {
        const { id } = await params; // This is the local DB ID of the chat

        const client = getClient();
        const status = getStatus();

        if (!client || status !== "READY") {
            return NextResponse.json({ error: 'WhatsApp client not ready' }, { status: 503 });
        }

        // Get chat's whatsappId from DB
        const dbChat = await db.chat.findUnique({ where: { id } });
        if (!dbChat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        // Fetch messages directly from WhatsApp
        const waChat = await client.getChatById(dbChat.whatsappId);
        const waMessages = await waChat.fetchMessages({ limit: 50 });

        // Transform messages for UI
        const messages = [];
        for (const msg of waMessages) {
            let senderName = null;

            if (waChat.isGroup && !msg.fromMe && msg.author) {
                try {
                    const senderContact = await client.getContactById(msg.author);
                    senderName = senderContact.name || senderContact.pushname || senderContact.shortName || senderContact.number;
                } catch (e) {
                    // Try falling back to msg.author number
                    senderName = msg.author?.replace('@c.us', '') || null;
                }
            } else if (msg.fromMe) {
                senderName = 'Sen';
            }

            messages.push({
                id: msg.id._serialized,
                messageId: msg.id._serialized,
                text: msg.body || "",
                fromMe: msg.fromMe,
                senderName,
                timestamp: new Date(msg.timestamp * 1000).toISOString(),
                status: msg.ack >= 3 ? "READ" : (msg.ack >= 2 ? "DELIVERED" : "SENT")
            });
        }

        return NextResponse.json(messages);
    } catch (error) {
        console.error('API Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
