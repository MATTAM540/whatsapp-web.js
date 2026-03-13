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
        const { toPhone, text, sendAt, minDelay, maxDelay } = body;

        if (!toPhone || !text || !sendAt) {
            return NextResponse.json({ error: 'Telefon, mesaj ve gönderim zamanı gereklidir' }, { status: 400 });
        }

        // Split by comma or newline and filter empty strings
        const phones = toPhone.split(/[,\n]/).map(p => p.trim()).filter(p => p !== '');
        
        if (phones.length === 0) {
            return NextResponse.json({ error: 'Geçerli bir telefon numarası girin' }, { status: 400 });
        }

        const results = [];
        const batchId = phones.length > 1 ? crypto.randomUUID() : null;

        for (const phone of phones) {
            // Format phone for WhatsApp (ensure it ends with @c.us)
            let whatsappPhone = phone;
            if (!whatsappPhone.includes('@')) {
                let clean = whatsappPhone.replace(/\D/g, '');
                if (clean.length === 11 && clean.startsWith('05')) {
                    clean = '90' + clean.substring(1);
                } else if (clean.length === 10 && clean.startsWith('5')) {
                    clean = '90' + clean;
                }
                whatsappPhone = `${clean}@c.us`;
            }

            const scheduled = await db.scheduledMessage.create({
                data: {
                    toPhone: whatsappPhone,
                    text: text,
                    sendAt: new Date(sendAt),
                    status: 'PENDING',
                    minDelay: minDelay ? parseInt(minDelay) : 2,
                    maxDelay: maxDelay ? parseInt(maxDelay) : 5,
                    batchId: batchId
                }
            });
            results.push(scheduled);
        }

        return NextResponse.json(results.length === 1 ? results[0] : { success: true, count: results.length });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to create scheduled message' }, { status: 500 });
    }
}
