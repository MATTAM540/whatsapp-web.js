import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { vcfContent } = await req.json();

        if (!vcfContent) {
            return NextResponse.json({ error: "VCF içeriği bulunamadı" }, { status: 400 });
        }

        const contacts = [];
        const lines = vcfContent.split(/\r?\n/);
        let currentContact = {};

        for (const line of lines) {
            if (line.startsWith("BEGIN:VCARD")) {
                currentContact = {};
            } else if (line.startsWith("FN:")) {
                currentContact.name = line.substring(3).trim();
            } else if (line.startsWith("TEL")) {
                // Handle TEL;TYPE=CELL: or TEL: etc.
                const match = line.match(/TEL.*:(.+)/);
                if (match) {
                    currentContact.phoneNumber = match[1].replace(/\D/g, '');
                }
            } else if (line.startsWith("END:VCARD")) {
                if (currentContact.name && currentContact.phoneNumber) {
                    contacts.push({
                        name: currentContact.name,
                        phoneNumber: currentContact.phoneNumber
                    });
                }
            }
        }

        if (contacts.length === 0) {
            return NextResponse.json({ error: "VCF içerisinde geçerli bir kişi bulunamadı" }, { status: 400 });
        }

        // Batch upsert or createMany
        // For Turso/LibSQL, Prisma's createMany might be limited, let's do it in a loop or transaction
        const results = await Promise.allSettled(
            contacts.map(contact => 
                db.contact.upsert({
                    where: { phoneNumber: contact.phoneNumber },
                    update: { name: contact.name },
                    create: { name: contact.name, phoneNumber: contact.phoneNumber }
                })
            )
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.length - successCount;

        return NextResponse.json({ 
            success: true, 
            message: `${successCount} kişi başarıyla içe aktarıldı. ${failCount} hata.`,
            count: successCount
        });

    } catch (error) {
        console.error("VCF Import error:", error);
        return NextResponse.json({ error: "VCF içe aktarılırken hata oluştu" }, { status: 500 });
    }
}
