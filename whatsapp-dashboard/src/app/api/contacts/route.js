import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const contacts = await db.contact.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(contacts);
    } catch (error) {
        console.error("Fetch contacts error:", error);
        return NextResponse.json({ error: "Kişiler yüklenirken hata oluştu" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { name, phoneNumber } = await req.json();

        if (!name || !phoneNumber) {
            return NextResponse.json({ error: "İsim ve telefon numarası gereklidir" }, { status: 400 });
        }

        // Normalize phone number (remove spaces, plus, etc.)
        const normalizedPhone = phoneNumber.replace(/\D/g, '');

        const contact = await db.contact.create({
            data: {
                name,
                phoneNumber: normalizedPhone
            }
        });

        return NextResponse.json(contact);
    } catch (error) {
        console.error("Create contact error:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Bu telefon numarası zaten kayıtlı" }, { status: 400 });
        }
        return NextResponse.json({ error: "Kişi kaydedilirken hata oluştu" }, { status: 500 });
    }
}
