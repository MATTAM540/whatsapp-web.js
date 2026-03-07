import { NextResponse } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login'];

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (publicRoutes.includes(pathname)) {
        // If user is already logged in and tries to access /login, redirect to dashboard
        if (pathname === '/login' && request.cookies.has('dashboard-auth')) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // Check for auth cookie
    const authCookie = request.cookies.get('dashboard-auth');

    // If no valid auth cookie, redirect to login
    if (!authCookie || authCookie.value !== 'authenticated') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

// Ensure middleware only runs on relevant paths (exclude static files, images, etc.)
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (e.g. svg, png)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
