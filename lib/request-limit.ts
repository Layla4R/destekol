import { NextRequest,NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { getSupabase } from './supabase';
export const REQUEST_LIMITS = {
    'donor-login': { limit: 10, seconds: 900 },
    contact: { limit: 5, seconds: 600 },
    'contact-status': { limit: 30, seconds: 600 },
    chat: { limit: 20, seconds: 60 },
    'chat-audio': { limit: 10, seconds: 60 },
} as const;
type Scope = keyof typeof REQUEST_LIMITS;
const local = new Map<string, {
    hits: number;
    expires: number;
}>();
export function clientIdentity(headers: Headers): string {
    // Only trust a header overwritten by the hosting proxy. Never trust arbitrary X-Forwarded-For.
    const name = process.env.NETLIFY === 'true' ? 'x-nf-client-connection-ip' : process.env.RATE_LIMIT_TRUSTED_IP_HEADER;
    const value = name ? headers.get(name)?.trim() : undefined;
    return value && isIP(value) ? value : 'shared-unknown-client';
}
export function consumeLocal(bucket: string, limit: number, seconds: number, now = Date.now()) {
    for (const [key, value] of local)
        if (value.expires <= now)
            local.delete(key);
    const row = local.get(bucket) || { hits: 0, expires: now + seconds * 1000 };
    // Bound development-only memory without evicting active limits.
    if (!local.has(bucket) && local.size >= 10000)
        return { allowed: false, retry_after: seconds };
    row.hits = Math.min(row.hits + 1, limit + 1);
    local.set(bucket, row);
    return { allowed: row.hits <= limit, retry_after: Math.max(1, Math.ceil((row.expires - now) / 1000)) };
}
export async function enforceRequestLimit(req: NextRequest, scope: Scope) {
    const { limit, seconds } = REQUEST_LIMITS[scope];
    const bucket = scope + ':' + createHash('sha256').update(clientIdentity(req.headers)).digest('hex');
    try {
        let result;
        if (process.env.NODE_ENV !== 'production')
            result = consumeLocal(bucket, limit, seconds);
        else {
            const { data, error } = await getSupabase().rpc('consume_request_limit', {
                p_bucket: bucket, p_limit: limit, p_window_seconds: seconds,
            }).abortSignal(AbortSignal.timeout(3000));
            if (error || !data?.[0] || typeof data[0].allowed !== 'boolean')
                throw new Error('Rate limiter unavailable');
            result = data[0];
        }
        if (result.allowed)
            return null;
        const message = 'طلبات كثيرة. يرجى الانتظار ثم المحاولة مجدداً.';
        return NextResponse.json({ error: message, answer: message, audioUrl: '', retryAfter: result.retry_after }, {
            status: 429, headers: { 'Retry-After': String(result.retry_after), 'Cache-Control': 'no-store' },
        });
    }
    catch {
        // Never call paid/expensive services if the shared limiter is unavailable.
        const message = 'الخدمة غير متاحة مؤقتاً. يرجى المحاولة لاحقاً.';
        return NextResponse.json({ error: message, answer: message, audioUrl: '' }, {
            status: 503, headers: { 'Retry-After': '30', 'Cache-Control': 'no-store' },
        });
    }
}
