import { getRequestSite } from "./request-site";
/**
 * Loads translations from Supabase DB with fallback to local JSON files.
 * DB translations take priority — admin can edit them live.
 * Cache per request using unstable_cache.
 */
import { getSupabaseOrNull } from "./supabase";
export type TranslationMessages = Record<string, Record<string, string>>;
// In-memory cache per deployment (revalidated every 5 min)
const cache = new Map<string, {
    data: TranslationMessages;
    ts: number;
}>();
const TTL = 5 * 60 * 1000; // 5 minutes
async function loadFromDB(locale: string): Promise<TranslationMessages | null> {
    const supabase = getSupabaseOrNull();
    if (!supabase)
        return null;
    try {
        const { data, error } = await supabase
            .from("Translation")
            .select("namespace, key, value")
            .eq("locale", locale);
        if (error || !data?.length)
            return null;
        const messages: TranslationMessages = {};
        for (const row of data) {
            if (!messages[row.namespace])
                messages[row.namespace] = {};
            messages[row.namespace][row.key] = row.value;
        }
        return messages;
    }
    catch {
        return null;
    }
}
async function loadFromFile(locale: string): Promise<TranslationMessages> {
    try {
        return (await import(`../messages/${locale}.json`)).default;
    }
    catch {
        return {};
    }
}
export async function getTranslationMessages(locale: string): Promise<TranslationMessages> {
    const cacheKey = `${getRequestSite().id}:${locale}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < TTL)
        return cached.data;
    // Load file fallback first
    const fileMessages = await loadFromFile(locale);
    // Load DB translations (override file)
    const dbMessages = await loadFromDB(locale);
    let merged: TranslationMessages;
    if (dbMessages) {
        // Deep merge: DB values override file values
        merged = { ...fileMessages };
        for (const [ns, keys] of Object.entries(dbMessages)) {
            merged[ns] = { ...(merged[ns] || {}), ...keys };
        }
    }
    else {
        merged = fileMessages;
    }
    cache.set(cacheKey, { data: merged, ts: Date.now() });
    return merged;
}
/** Clear cache for a locale (called after admin saves translation) */
export function clearTranslationCache(locale?: string) {
    const prefix = `${getRequestSite().id}:`;
    if (locale)
        cache.delete(prefix + locale);
    else
        for (const key of cache.keys())
            if (key.startsWith(prefix))
                cache.delete(key);
}
