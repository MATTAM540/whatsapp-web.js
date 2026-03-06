import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const chats = await db.chat.findMany({
            orderBy: { lastTimestamp: 'desc' },
            include: {
                _count: {
                    select: { messages: true }
                }
            }
        });
        return NextResponse.json(chats);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }
}
