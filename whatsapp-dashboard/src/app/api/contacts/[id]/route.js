import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
    try {
        const { id } = await params;
        const { name, phoneNumber } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "ID gereklidir" }, { status: 400 });
        }

        // Normalize phone number
        let normalizedPhone = phoneNumber;
        if (phoneNumber) {
            normalizedPhone = phoneNumber.replace(/\D/g, '');
            
            // Normalize Turkish numbers
            if (normalizedPhone.startsWith('05') && normalizedPhone.length === 11) {
                normalizedPhone = '90' + normalizedPhone.substring(1);
            } else if (normalizedPhone.startsWith('5') && normalizedPhone.length === 10) {
                normalizedPhone = '90' + normalizedPhone;
            }
        }

        const contact = await db.contact.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(normalizedPhone && { phoneNumber: normalizedPhone })
            }
        });

        return NextResponse.json(contact);
    } catch (error) {
        console.error("Update contact error:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Bu telefon numarası zaten başka bir kişide kayıtlı" }, { status: 400 });
        }
        return NextResponse.json({ 
            error: "Kişi güncellenirken hata oluştu",
            message: error.message
        }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "ID gereklidir" }, { status: 400 });
        }

        await db.contact.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Kişi silindi" });
    } catch (error) {
        console.error("Delete contact error:", error);
        return NextResponse.json({ 
            error: "Kişi silinirken hata oluştu",
            message: error.message
        }, { status: 500 });
    }
}
