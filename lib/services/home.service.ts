import { getPageBySlug } from "@/lib/pageData";
import { normalizeDestekolBrandCopy } from "@/lib/destekol-brand-copy";
import { getSupabaseOrNull } from "@/lib/supabase";
export async function getHomeData(locale: string) {
    const supabase = getSupabaseOrNull();
    if (!supabase) {
        return {
            page: null,
            settings: null,
            campaigns: [],
            posts: [],
            stats: { total: 0, families: 0 },
            pageSections: [],
        };
    }
    const [page, settingsRes, campaignsRes, postsRes, statsRes] = await Promise.all([
        getPageBySlug("home", locale),
        supabase.from("SiteSettings").select("accentColor, primaryColor, siteName, logoImage, contactEmail, footerDescription, defaultCurrency").eq("id", "default").maybeSingle(),
        supabase.from("Campaign").select("id, slug, title, summary, coverImage, goalAmount, raisedAmount, donorCount, defaultAmount, category, isFeatured").eq("isActive", true).order("isFeatured", { ascending: false }).limit(12),
        supabase.from("NewsPost").select("id, title, excerpt, coverImage, videoUrl, slug, publishedAt").eq("isPublished", true).order("publishedAt", { ascending: false }).limit(3),
        supabase.rpc("get_dashboard_stats"),
    ]);
    let campaigns = campaignsRes.data || [];
    let posts = postsRes.data || [];
    if (locale !== "ar" && posts.length) {
        const translated = await supabase.from("NewsPostTranslation").select("postId,title,excerpt")
            .eq("locale", locale).in("postId", posts.map(post => post.id));
        const byId = new Map((translated.data || []).map(row => [row.postId, row]));
        posts = posts.map(post => {
            const row = byId.get(post.id);
            return row ? { ...post, title: row.title || post.title, excerpt: row.excerpt || post.excerpt } : post;
        });
    }
    // 🌟 دمج الترجمات للحملات إذا كانت اللغة غير العربية
    if (locale !== "ar" && campaigns.length > 0) {
        const campaignIds = campaigns.map((c: any) => c.id);
        const { data: translations } = await supabase
            .from("CampaignTranslation")
            .select("campaignId, title, summary, description")
            .in("campaignId", campaignIds)
            .eq("locale", locale);
        if (translations && translations.length > 0) {
            const transMap = new Map(translations.map((t: any) => [t.campaignId, t]));
            campaigns = campaigns.map((campaign: any) => {
                const trans: any = transMap.get(campaign.id);
                if (!trans)
                    return campaign;
                return {
                    ...campaign,
                    title: trans.title || campaign.title,
                    summary: trans.summary || campaign.summary,
                };
            });
        }
    }
    const ids = (page?.sections || []).filter((s: any) => s.type === "kindness_box").flatMap((s: any) => (s.props?.items || []).map((i: any) => i.campaignId)).filter(Boolean);
    let kindnessCampaigns: any[] = [];
    if (ids.length) {
        const result = await supabase.from("Campaign").select("id,slug,title,category").eq("isActive", true).in("id", ids);
        kindnessCampaigns = result.data || [];
        if (locale !== "ar" && kindnessCampaigns.length) {
            const translations = await supabase.from("CampaignTranslation").select("campaignId,title").eq("locale", locale).in("campaignId", ids);
            const names = new Map((translations.data || []).map(t => [t.campaignId, t.title]));
            kindnessCampaigns = kindnessCampaigns.map(c => ({ ...c, title: names.get(c.id) || c.title }));
        }
    }
    return normalizeDestekolBrandCopy({
        kindnessCampaigns,
        page,
        pageSections: page?.sections || [],
        settings: settingsRes.data,
        campaigns,
        posts,
        stats: statsRes.data || { total: 0, families: 0 },
    }, locale);
}
