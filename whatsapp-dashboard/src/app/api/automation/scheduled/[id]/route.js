import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE a scheduled message (cancel it)
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        await db.scheduledMessage.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to delete scheduled message' }, { status: 500 });
    }
}
