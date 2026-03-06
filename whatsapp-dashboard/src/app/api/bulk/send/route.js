import { NextResponse } from 'next/server';
import { getClient, getStatus } from '@/lib/whatsapp-client';

export async function POST(request) {
    try {
        const body = await request.json();
        const { recipients, message, minDelay, maxDelay } = body;

        const client = getClient();
        const status = getStatus();

        if (!client || status !== "READY") {
            return NextResponse.json({ error: 'WhatsApp bağlantısı hazır değil.' }, { status: 503 });
        }

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return NextResponse.json({ error: 'Alıcı listesi boş olamaz.' }, { status: 400 });
        }

        // Run bulk sending in the background (don't await it completely before returning)
        // This allows the API to respond immediately while the job continues
        processBulkSend(recipients, message, minDelay, maxDelay);

        return NextResponse.json({ success: true, message: 'Toplu gönderim işlemi başlatıldı.' });
    } catch (error) {
        console.error('Bulk API Error:', error);
        return NextResponse.json({ error: 'İşlem başlatılırken bir hata oluştu.' }, { status: 500 });
    }
}

async function processBulkSend(recipients, message, minDelay, maxDelay) {
    const client = getClient();
    const io = globalThis.socketIO;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];

        // Wait for random delay (except for the first one)
        if (i > 0) {
            const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        try {
            // Format number if needed (ensure it has @c.us)
            let chatId = recipient;
            if (!chatId.includes('@')) {
                chatId = `${chatId.replace(/\D/g, '')}@c.us`;
            }

            await client.sendMessage(chatId, message);
            successCount++;

            io?.emit("bulk_progress", {
                current: i + 1,
                total: recipients.length,
                recipient: recipient,
                success: true
            });
        } catch (err) {
            console.error(`Failed to send to ${recipient}:`, err);
            failCount++;

            io?.emit("bulk_progress", {
                current: i + 1,
                total: recipients.length,
                recipient: recipient,
                success: false,
                message: err.message
            });
        }
    }

    io?.emit("bulk_complete", {
        total: recipients.length,
        successCount,
        failCount
    });
}
