import { getSupabaseOrNull } from "./supabase";
export async function getCmsBranding(locale?: string): Promise<Record<string, string | null>> {
    const db = getSupabaseOrNull();
    if (!db) return {};
    const { data } = await db.from("SiteSettings")
        .select("siteName,logoText,logoImage,footerDescription,contactEmail")
        .eq("id", "default").maybeSingle();
    if (!locale) return data || {};
    const { data: translation } = await db.from("Translation").select("value")
        .eq("key", "site.name").eq("locale", locale).maybeSingle();
    return { ...(data || {}), ...(translation?.value ? { siteName: translation.value } : {}) };
}
