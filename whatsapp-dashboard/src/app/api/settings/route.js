import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const settings = await db.appSetting.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        return NextResponse.json(settingsMap);
    } catch (error) {
        console.error("Settings GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const data = await req.json();
        // data will be an object of key value pairs like { autoRejectCalls: "true" }

        for (const [key, value] of Object.entries(data)) {
            await db.appSetting.upsert({
                where: { key: String(key) },
                update: { value: String(value) },
                create: { key: String(key), value: String(value) }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Settings POST Error:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
