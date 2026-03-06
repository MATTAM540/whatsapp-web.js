import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH - toggle active or update rule
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const rule = await db.autoReplyRule.update({
            where: { id },
            data: body
        });

        return NextResponse.json(rule);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
    }
}

// DELETE a rule
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        await db.autoReplyRule.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
    }
}
