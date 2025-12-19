// Rate limiting utility for API routes
// Simple in-memory implementation for MVP

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
    interval: number; // in milliseconds
    maxRequests: number;
}

export const RATE_LIMITS = {
    // Tracking endpoint - strict to prevent enumeration
    trackFolio: { interval: 60000, maxRequests: 5 }, // 5 per minute

    // Create ticket - moderate
    createTicket: { interval: 60000, maxRequests: 3 }, // 3 per minute

    // Coverage check - relaxed
    coverageCheck: { interval: 60000, maxRequests: 20 }, // 20 per minute

    // Login - strict
    login: { interval: 300000, maxRequests: 5 }, // 5 per 5 minutes

    // Default
    default: { interval: 60000, maxRequests: 60 },
} as const;

export function getClientIP(request: Request): string {
    // Try various headers for real IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Fallback - not ideal but works for development
    return 'unknown';
}

export function checkRateLimit(
    key: string,
    config: RateLimitConfig = RATE_LIMITS.default
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
        cleanupExpiredEntries();
    }

    if (!entry || now >= entry.resetAt) {
        // First request or expired - create new entry
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + config.interval,
        });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetIn: config.interval,
        };
    }

    if (entry.count >= config.maxRequests) {
        // Rate limit exceeded
        return {
            allowed: false,
            remaining: 0,
            resetIn: entry.resetAt - now,
        };
    }

    // Increment count
    entry.count++;
    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetIn: entry.resetAt - now,
    };
}

function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now >= entry.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}

// Helper to create rate limit response
export function rateLimitResponse(resetIn: number): Response {
    return new Response(
        JSON.stringify({
            error: 'Demasiadas solicitudes. Por favor, espera un momento.',
            retryAfter: Math.ceil(resetIn / 1000),
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': Math.ceil(resetIn / 1000).toString(),
            },
        }
    );
}

// Middleware-style rate limiter for API routes
export function withRateLimit(
    handler: (request: Request) => Promise<Response>,
    limitName: keyof typeof RATE_LIMITS = 'default'
) {
    return async (request: Request): Promise<Response> => {
        const ip = getClientIP(request);
        const key = `${limitName}:${ip}`;
        const config = RATE_LIMITS[limitName];

        const { allowed, remaining, resetIn } = checkRateLimit(key, config);

        if (!allowed) {
            return rateLimitResponse(resetIn);
        }

        const response = await handler(request);

        // Add rate limit headers
        const newResponse = new Response(response.body, response);
        newResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
        newResponse.headers.set('X-RateLimit-Reset', Math.ceil(resetIn / 1000).toString());

        return newResponse;
    };
}
