import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        if (!db) {
            console.error("DEBUG: db is undefined!");
            return NextResponse.json({ error: "Database client is not initialized" }, { status: 500 });
        }
        
        if (!db.contact) {
            console.error("DEBUG: db.contact is undefined! Available models:", Object.keys(db).filter(k => !k.startsWith('_')));
            // Try to force a re-generation or check if it's under a different name
            return NextResponse.json({ 
                error: "Contact model not found in database client", 
                availableModels: Object.keys(db).filter(k => !k.startsWith('_'))
            }, { status: 500 });
        }

        const contacts = await db.contact.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(contacts);
    } catch (error) {
        console.error("Fetch contacts error caught in route:", error);
        return NextResponse.json({ 
            error: "Kişiler yüklenirken hata oluştu",
            message: error.message,
            code: error.code,
            meta: error.meta
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        if (!db || !db.contact) {
            return NextResponse.json({ error: "Veritabanı bağlantısı kurulamadı" }, { status: 500 });
        }

        const { name, phoneNumber } = await req.json();

        if (!name || !phoneNumber) {
            return NextResponse.json({ error: "İsim ve telefon numarası gereklidir" }, { status: 400 });
        }

        // Normalize phone number (remove spaces, plus, etc.)
        let normalizedPhone = phoneNumber.replace(/\D/g, '');

        // Normalize Turkish numbers
        if (normalizedPhone.startsWith('05') && normalizedPhone.length === 11) {
            normalizedPhone = '90' + normalizedPhone.substring(1);
        } else if (normalizedPhone.startsWith('5') && normalizedPhone.length === 10) {
            normalizedPhone = '90' + normalizedPhone;
        }

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
        return NextResponse.json({ 
            error: "Kişi kaydedilirken hata oluştu",
            message: error.message
        }, { status: 500 });
    }
}
