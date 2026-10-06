// Edge-compatible: resolve only when authenticating, never at module import.
export function getSessionSecret(): Uint8Array {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret || !secret.trim() || new TextEncoder().encode(secret).length < 32 ||
        secret === 'dev-secret-change-me' || secret === 'fallback-secret-key-32-chars-long' ||
        secret === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || secret === process.env.SUPABASE_ANON_KEY) {
        throw new Error('AUTH_CONFIGURATION_ERROR');
    }
    return new TextEncoder().encode(secret);
}
