import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        // Try to get existing stats
        let stats = await db.systemStat.findFirst();

        // If no stats exist (first run), create one
        if (!stats) {
            stats = await db.systemStat.create({
                data: {
                    messagesSent: 0,
                    messagesRcvd: 0,
                    activeChats: 0
                }
            });
        }

        // Also get contact count
        const contactCount = await db.contact.count();

        // Get chat count
        const chatCount = await db.chat.count();

        return NextResponse.json({
            ...stats,
            contactCount,
            chatCount
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
