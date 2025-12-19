import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Rate Limiting Store (in-memory for single instance)
 * For production with multiple instances, use Redis/Upstash
 */
const loginAttempts = new Map<string, { count: number; resetAt: number; blockedUntil?: number }>();

const LOGIN_RATE_LIMIT = {
    maxAttempts: 5,
    windowMs: 60 * 1000,        // 1 minute
    blockDurationMs: 15 * 60 * 1000, // 15 minutes block
};

function getClientIP(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    const realIP = request.headers.get('x-real-ip');
    if (realIP) return realIP;
    // Fallback for development
    return 'unknown';
}

function checkLoginRateLimit(ip: string): { blocked: boolean; remainingAttempts: number; blockExpiresAt?: Date } {
    const now = Date.now();
    const entry = loginAttempts.get(ip);

    if (!entry) {
        return { blocked: false, remainingAttempts: LOGIN_RATE_LIMIT.maxAttempts };
    }

    // Check if blocked
    if (entry.blockedUntil && entry.blockedUntil > now) {
        return {
            blocked: true,
            remainingAttempts: 0,
            blockExpiresAt: new Date(entry.blockedUntil),
        };
    }

    // Block expired or window reset
    if ((entry.blockedUntil && entry.blockedUntil <= now) || entry.resetAt <= now) {
        loginAttempts.delete(ip);
        return { blocked: false, remainingAttempts: LOGIN_RATE_LIMIT.maxAttempts };
    }

    const remaining = LOGIN_RATE_LIMIT.maxAttempts - entry.count;
    return { blocked: remaining <= 0, remainingAttempts: Math.max(0, remaining) };
}

function recordLoginAttempt(ip: string): void {
    const now = Date.now();
    const entry = loginAttempts.get(ip);

    if (!entry || entry.resetAt <= now) {
        loginAttempts.set(ip, {
            count: 1,
            resetAt: now + LOGIN_RATE_LIMIT.windowMs,
        });
        return;
    }

    entry.count += 1;

    if (entry.count >= LOGIN_RATE_LIMIT.maxAttempts) {
        entry.blockedUntil = now + LOGIN_RATE_LIMIT.blockDurationMs;
    }

    loginAttempts.set(ip, entry);
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Apply rate limiting only to login-related paths
    if (pathname === '/login' && request.method === 'POST') {
        const ip = getClientIP(request);
        const { blocked, remainingAttempts, blockExpiresAt } = checkLoginRateLimit(ip);

        if (blocked) {
            const minutesRemaining = blockExpiresAt
                ? Math.ceil((blockExpiresAt.getTime() - Date.now()) / 60000)
                : 15;

            return new NextResponse(
                JSON.stringify({
                    error: `Demasiados intentos. Cuenta bloqueada por ${minutesRemaining} minutos.`,
                    blockedUntil: blockExpiresAt?.toISOString(),
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': (minutesRemaining * 60).toString(),
                    },
                }
            );
        }

        // Record the attempt
        recordLoginAttempt(ip);

        // Add rate limit info headers
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Remaining', remainingAttempts.toString());
        return response;
    }

    // Add security headers to all responses
    const response = NextResponse.next();

    // CORS headers for API routes
    if (pathname.startsWith('/api/')) {
        const origin = request.headers.get('origin') || '';
        const allowedOrigins = [
            process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'https://cablemaster.com.mx',
        ];

        if (allowedOrigins.includes(origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin);
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            response.headers.set('Access-Control-Max-Age', '86400');
        }

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, { status: 200, headers: response.headers });
        }
    }

    return response;
}

// Configure which routes the middleware applies to
export const config = {
    matcher: [
        // Apply to login page
        '/login',
        // Apply to API routes
        '/api/:path*',
        // Skip static files and images
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
