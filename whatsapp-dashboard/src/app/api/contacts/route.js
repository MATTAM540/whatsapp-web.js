import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const contacts = await db.contact.findMany({
            orderBy: { dateAdded: 'desc' }
        });
        return NextResponse.json(contacts);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, phone, amount } = body;

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        const contact = await db.contact.create({
            data: {
                name,
                phone,
                amount: amount ? parseFloat(amount) : null,
            }
        });

        return NextResponse.json(contact);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
    }
}
