import { getSupabaseOrNull } from "./supabase";
export async function getCmsBranding(): Promise<Record<string, string | null>> {
    const db = getSupabaseOrNull();
    if (!db) return {};
    const { data } = await db.from("SiteSettings")
        .select("siteName,logoText,logoImage,footerDescription,contactEmail")
        .eq("id", "default").maybeSingle();
    return data || {};
}
