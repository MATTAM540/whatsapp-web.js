import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all auto-reply rules
export async function GET() {
    try {
        const rules = await db.autoReplyRule.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(rules);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch auto-reply rules' }, { status: 500 });
    }
}

// POST create a new auto-reply rule
export async function POST(request) {
    try {
        const body = await request.json();
        const { triggerType, keyword, replyText } = body;

        if (!triggerType || !replyText) {
            return NextResponse.json({ error: 'Tetikleme tipi ve yanıt metni gereklidir' }, { status: 400 });
        }

        if (triggerType !== 'ALWAYS' && !keyword) {
            return NextResponse.json({ error: 'Anahtar kelime gereklidir' }, { status: 400 });
        }

        const rule = await db.autoReplyRule.create({
            data: {
                triggerType,
                keyword: triggerType === 'ALWAYS' ? null : keyword,
                replyText,
                isActive: true
            }
        });

        return NextResponse.json(rule);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to create auto-reply rule' }, { status: 500 });
    }
}
