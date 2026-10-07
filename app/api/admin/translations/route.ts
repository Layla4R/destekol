import { requireRoutePermission, accessErrorResponse } from "@/lib/admin-access";
import { clearTranslationCache } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
const VALID_LOCALES = ["ar", "en", "fr", "tr"];
export async function GET(req: NextRequest) {
    try {
        await requireRoutePermission(req);
    }
    catch(error) { return accessErrorResponse(error); }
    const rawLocale = new URL(req.url).searchParams.get("locale") || "ar";
    const locale = VALID_LOCALES.includes(rawLocale) ? rawLocale : "ar";
    const supabase = getSupabase();
    const { data: dbRows } = await supabase.from("Translation").select("*").eq("locale", locale).order("key");
    // Import fallbacks to show all keys even if not in DB yet
    const { FALLBACKS } = await import("@/lib/i18n");
    const fallback: Record<string, string> = (FALLBACKS as any)[locale] || (FALLBACKS as any)["ar"] || {};
    // Merge: DB overrides fallbacks
    const dbMap: Record<string, any> = {};
    for (const row of (dbRows || []))
        dbMap[row.key] = row;
    const allKeys = Array.from(new Set([...Object.keys(fallback), ...Object.keys(dbMap)])).sort();
    const merged = allKeys.map(key => ({
        id: dbMap[key]?.id || `fallback-${key}`,
        locale,
        key,
        value: dbMap[key]?.value ?? fallback[key] ?? "",
        isFromDB: !!dbMap[key],
    }));
    return NextResponse.json({ translations: merged });
}
export async function PATCH(req: NextRequest) {
    try {
        await requireRoutePermission(req);
    }
    catch(error) { return accessErrorResponse(error); }
    const body = await req.json();
    // Batch save support
    if (body.batch && Array.isArray(body.batch)) {
        const supabase = getSupabase();
        const results = await Promise.allSettled(body.batch.map(({ locale, key, value }: {
            locale: string;
            key: string;
            value: string;
        }) => {
            if (!VALID_LOCALES.includes(locale) || typeof key !== "string" || typeof value !== "string")
                throw new Error("Invalid translation");
            return supabase.from("Translation").upsert({ locale, key, value, namespace: key.split(".")[0] || "common", updatedAt: new Date().toISOString() }, { onConflict: "locale,namespace,key" });
        }));
        const failed = results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && r.value.error)).length;
        // Clear translation cache if available
        try {
            clearTranslationCache();
        }
        catch { }
        return NextResponse.json({ ok: failed === 0, failed }, { status: failed ? 500 : 200 });
    }
    const { locale, key, value } = body;
    if (!VALID_LOCALES.includes(locale) || typeof key !== "string" || !key || typeof value !== "string")
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const supabase = getSupabase();
    const { error } = await supabase.from("Translation").upsert({ locale, key, value, namespace: key.split(".")[0] || "common", updatedAt: new Date().toISOString() }, { onConflict: "locale,namespace,key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    clearTranslationCache(locale);
    return NextResponse.json({ ok: true });
}
