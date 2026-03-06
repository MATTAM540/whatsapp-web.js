import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all scheduled messages
export async function GET() {
    try {
        const messages = await db.scheduledMessage.findMany({
            orderBy: { sendAt: 'asc' }
        });
        return NextResponse.json(messages);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch scheduled messages' }, { status: 500 });
    }
}

// POST create a new scheduled message
export async function POST(request) {
    try {
        const body = await request.json();
        const { toPhone, text, sendAt } = body;

        if (!toPhone || !text || !sendAt) {
            return NextResponse.json({ error: 'Telefon, mesaj ve gönderim zamanı gereklidir' }, { status: 400 });
        }

        // Format phone for WhatsApp (ensure it ends with @c.us)
        let whatsappPhone = toPhone.replace(/[^0-9]/g, '');
        if (!whatsappPhone.endsWith('@c.us')) {
            whatsappPhone = whatsappPhone + '@c.us';
        }

        const scheduled = await db.scheduledMessage.create({
            data: {
                toPhone: whatsappPhone,
                text,
                sendAt: new Date(sendAt),
                status: 'PENDING'
            }
        });

        return NextResponse.json(scheduled);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to create scheduled message' }, { status: 500 });
    }
}
