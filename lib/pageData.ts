import { getSupabaseOrNull } from "./supabase";
import { mergeCmsTranslation } from "./cms-localization";
export interface PageData {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    sections: any[];
    createdAt?: string;
    updatedAt?: string;
}
export interface CampaignLite {
    id: string;
    slug: string;
    title: string;
    summary: string;
    description?: string;
    coverImage: string | null;
    goalAmount: number;
    raisedAmount: number;
    donorCount: number;
    defaultAmount?: number;
    isFeatured?: boolean;
    category?: string;
    country?: string | null;
}
/**
 * Get a page for a given slug and locale.
 * Priority: PageTranslation[locale] → Page (base/ar)
 */
export async function getPageBySlug(slug: string, locale = "ar"): Promise<PageData | null> {
    const supabase = getSupabaseOrNull();
    if (!supabase)
        return null;
    const { data: base } = await supabase
        .from("Page")
        .select("id, slug, title, description, sections, createdAt, updatedAt")
        .eq("slug", slug)
        .eq("isPublished", true)
        .maybeSingle();
    if (!base)
        return null;
    // For non-Arabic locales, check for translation
    if (locale !== "ar") {
        const { data: trans } = await supabase
            .from("PageTranslation")
            .select("title, description, sections, updatedAt")
            .eq("pageId", base.id)
            .eq("locale", locale)
            .maybeSingle();
        if (trans) {
            return {
                id: base.id,
                slug: base.slug,
                title: trans.title,
                description: trans.description,
                sections: mergeCmsTranslation(base.sections || [], trans.sections),
                createdAt: base.createdAt,
                updatedAt: trans.updatedAt || base.updatedAt,
            };
        }
    }
    return {
        id: base.id,
        slug: base.slug,
        title: base.title,
        description: base.description,
        sections: base.sections as any[],
        createdAt: base.createdAt,
        updatedAt: base.updatedAt,
    };
}
/**
 * Get active campaigns with automatic translation fallback based on locale.
 */
export async function getCampaignsLite(locale = "ar"): Promise<CampaignLite[]> {
    const supabase = getSupabaseOrNull();
    if (!supabase)
        return [];
    try {
        const { data: campaigns } = await supabase
            .from("Campaign")
            .select("id, slug, title, summary, description, coverImage, goalAmount, raisedAmount, donorCount, defaultAmount, category, country, isFeatured")
            .eq("isActive", true)
            .order("isFeatured", { ascending: false })
            .limit(6);
        if (!campaigns || campaigns.length === 0)
            return [];
        // إذا كانت اللغة عربية، إرجاع الحملات كما هي
        if (locale === "ar")
            return campaigns as CampaignLite[];
        // جلب الترجمات الخاصة باللغة المحددة
        const campaignIds = campaigns.map((c) => c.id);
        const { data: translations } = await supabase
            .from("CampaignTranslation")
            .select("campaignId, title, summary, description")
            .in("campaignId", campaignIds)
            .eq("locale", locale);
        if (!translations || translations.length === 0)
            return campaigns as CampaignLite[];
        const transMap = new Map(translations.map((t) => [t.campaignId, t]));
        // دمج الترجمة إن وجدت
        return campaigns.map((campaign) => {
            const trans = transMap.get(campaign.id);
            if (!trans)
                return campaign;
            return {
                ...campaign,
                title: trans.title || campaign.title,
                summary: trans.summary || campaign.summary,
                description: trans.description || campaign.description,
            };
        }) as CampaignLite[];
    }
    catch (error) {
        console.error("Error loading campaigns with translations:", error);
        return [];
    }
}
