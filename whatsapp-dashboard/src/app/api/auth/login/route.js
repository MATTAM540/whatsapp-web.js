import { NextResponse } from "next/server";
import crypto from "crypto";

// Simple in-memory rate limiter mapping IP to { attempts: number, lastAttempt: number }
const rateLimiter = new Map();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request) {
    try {
        const body = await request.json();
        const { password } = body;

        // Note: In Next.js App Router, request.ip is sometimes null depending on the hosting provider (it works well on Vercel).
        // For a raw Debian server without a reverse proxy forwarding the IP properly, we might fallback to a generic bucket or read 'x-forwarded-for'.
        const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";

        // --- Rate Limiting Logic ---
        const now = Date.now();
        const record = rateLimiter.get(ip) || { attempts: 0, lastAttempt: now };

        // Check if blocked
        if (record.attempts >= MAX_ATTEMPTS) {
            const timeSinceLastAttempt = now - record.lastAttempt;
            if (timeSinceLastAttempt < BLOCK_DURATION_MS) {
                // Still blocked
                const remainingMinutes = Math.ceil((BLOCK_DURATION_MS - timeSinceLastAttempt) / 60000);
                return NextResponse.json(
                    { success: false, message: `Çok fazla hatalı giriş. Litfen ${remainingMinutes} dakika sonra tekrar deneyin.` },
                    { status: 429 }
                );
            } else {
                // Block expired, reset
                record.attempts = 0;
            }
        }

        // --- Password Checking Logic ---
        const correctPassword = process.env.APP_PASSWORD;

        if (!correctPassword) {
            console.error("CRITICAL: APP_PASSWORD is not set in environment variables!");
            return NextResponse.json(
                { success: false, message: "Sunucu yapılandırma hatası. Yönetici ile iletişime geçin." },
                { status: 500 }
            );
        }

        if (!password) {
            return NextResponse.json(
                { success: false, message: "Şifre gerekli." },
                { status: 400 }
            );
        }

        // Use timing-safe equal to prevent timing attacks
        // Both strings must be the same length for timingSafeEqual, so handle length mismatch safely
        const inputBuffer = Buffer.from(password);
        const correctBuffer = Buffer.from(correctPassword);

        let isMatch = false;
        if (inputBuffer.length === correctBuffer.length) {
            isMatch = crypto.timingSafeEqual(inputBuffer, correctBuffer);
        } else {
            // Fake comparison to avoid timing leak over length differences
            crypto.timingSafeEqual(correctBuffer, correctBuffer);
        }

        if (isMatch) {
            // Success! Reset rate limit for this IP
            rateLimiter.delete(ip);

            // Create response and set cookie
            const response = NextResponse.json({ success: true }, { status: 200 });

            response.cookies.set({
                name: 'dashboard-auth',
                value: 'authenticated',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
            });

            return response;

        } else {
            // Failed attempt
            record.attempts += 1;
            record.lastAttempt = now;
            rateLimiter.set(ip, record);

            return NextResponse.json(
                { success: false, message: "Hatalı şifre." },
                { status: 401 }
            );
        }

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json(
            { success: false, message: "Bir hata oluştu." },
            { status: 500 }
        );
    }
}
