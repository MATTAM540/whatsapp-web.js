import { NextResponse } from "next/server";

export async function POST(request) {
    const response = NextResponse.json({ success: true }, { status: 200 });

    // Clear the auth cookie
    response.cookies.delete('dashboard-auth');

    return response;
}
