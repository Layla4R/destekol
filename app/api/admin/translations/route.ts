import { requireAdmin } from "@/lib/auth";
import { clearTranslationCache } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
const VALID_LOCALES = ["ar", "en", "fr", "tr"];
export async function GET(req: NextRequest) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    // Batch save support
    if (body.batch && Array.isArray(body.batch)) {
        const supabase = getSupabase();
        const results = await Promise.allSettled(body.batch.map(({ locale, key, value }: {
            locale: string;
            key: string;
            value: string;
        }) => supabase.from("Translation").upsert({ locale, key, value }, { onConflict: "locale,key" })));
        const failed = results.filter(r => r.status === "rejected").length;
        // Clear translation cache if available
        try {
            const { clearTranslationCache } = await import("@/lib/translations");
            clearTranslationCache();
        }
        catch { }
        return NextResponse.json({ ok: true, failed });
    }
    const { locale, key, value } = body;
    if (!locale || !key || value === undefined)
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const supabase = getSupabase();
    await supabase.from("Translation").upsert({ locale, key, value, updatedAt: new Date().toISOString() }, { onConflict: "locale,key" });
    clearTranslationCache(locale);
    return NextResponse.json({ ok: true });
}
