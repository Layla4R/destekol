import { getSupabaseOrNull } from "./supabase";
import { withDestekolIdentity } from './destekol-brand-copy';
export async function getCmsBranding(locale?: string): Promise<Record<string, string | null>> {
    const db = getSupabaseOrNull();
    if (!db) return withDestekolIdentity({});
    const { data } = await db.from("SiteSettings")
        .select("siteName,logoText,logoImage,footerDescription,contactEmail")
        .eq("id", "default").maybeSingle();
    if (!locale) return withDestekolIdentity(data || {});
    const { data: translation } = await db.from("Translation").select("value")
        .eq("key", "site.name").eq("locale", locale).maybeSingle();
    return withDestekolIdentity({ ...(data || {}), ...(translation?.value ? { siteName: translation.value } : {}) }, locale);
}
