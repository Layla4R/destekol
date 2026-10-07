import { LOCALES } from "@/lib/i18n";
import { LEGAL_SLUGS, POLICY_UPDATED_AT } from "@/lib/current-policies";
import { getRequestSite } from "@/lib/request-site";
import { getSupabaseOrNull } from "@/lib/supabase";
import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const SITE_URL = getRequestSite().url;
    const supabase = getSupabaseOrNull();
    // LOCALES is a readonly tuple, so do not cast it to string[].
    // We can iterate over it directly.
    const locales = LOCALES;
    const now = new Date();
    const urls: MetadataRoute.Sitemap = [];
    for (const slug of LEGAL_SLUGS) {
        for (const locale of locales) {
            urls.push({ url: `${SITE_URL}/${locale}/${slug}`, lastModified: new Date(`${POLICY_UPDATED_AT}T00:00:00Z`), changeFrequency: 'monthly', priority: 0.5 });
        }
    }
    /*
     * 1. Home pages
     */
    for (const locale of locales) {
        urls.push({
            url: `${SITE_URL}/${locale}`,
            lastModified: now,
            changeFrequency: "daily",
            priority: 1,
        });
    }
    /*
     * 2. Main static pages
     */
    const staticPages = [
        "about",
        "contact",
        "transparency",
        "campaigns",
        "news",
    ] as const;
    for (const slug of staticPages) {
        for (const locale of locales) {
            urls.push({
                url: `${SITE_URL}/${locale}/${slug}`,
                lastModified: now,
                changeFrequency: slug === "campaigns" || slug === "news"
                    ? "daily"
                    : "weekly",
                priority: slug === "campaigns" ? 0.9 : 0.8,
            });
        }
    }
    /*
     * If Supabase is unavailable,
     * return the static URLs only.
     */
    if (!supabase) {
        return urls;
    }
    /*
     * 3. CMS Pages
     */
    const { data: pages } = await supabase
        .from("Page")
        .select("slug, updatedAt, isPublished")
        .eq("isPublished", true);
    if (pages?.length) {
        for (const page of pages) {
            if (!page.slug || page.slug === "license") {
                continue;
            }
            for (const locale of locales) {
                const url = `${SITE_URL}/${locale}/${page.slug}`;
                /*
                 * Avoid duplicating pages that already exist
                 * in staticPages.
                 */
                if (!urls.some((item) => item.url === url)) {
                    urls.push({
                        url,
                        lastModified: page.updatedAt || now,
                        changeFrequency: "monthly",
                        priority: 0.7,
                    });
                }
            }
        }
    }
    /*
     * 4. Campaign pages
     */
    const { data: campaigns } = await supabase
        .from("Campaign")
        .select("slug, updatedAt")
        .eq("isPublished", true);
    if (campaigns?.length) {
        for (const campaign of campaigns) {
            if (!campaign.slug) {
                continue;
            }
            for (const locale of locales) {
                urls.push({
                    url: `${SITE_URL}/${locale}/campaigns/${campaign.slug}`,
                    lastModified: campaign.updatedAt || now,
                    changeFrequency: "daily",
                    priority: 0.9,
                });
            }
        }
    }
    /*
     * 5. News posts
     */
    const { data: newsPosts } = await supabase
        .from("NewsPost")
        .select("slug, publishedAt, updatedAt")
        .eq("isPublished", true);
    if (newsPosts?.length) {
        for (const post of newsPosts) {
            if (!post.slug) {
                continue;
            }
            for (const locale of locales) {
                urls.push({
                    url: `${SITE_URL}/${locale}/news/${post.slug}`,
                    lastModified: post.updatedAt ||
                        post.publishedAt ||
                        now,
                    changeFrequency: "monthly",
                    priority: 0.8,
                });
            }
        }
    }
    return urls.map(item => {
        const path = new URL(item.url).pathname.replace(/^\/(ar|en|fr|tr)(?=\/|$)/, "");
        return {
            ...item,
            alternates: {
                languages: Object.fromEntries(locales.map(locale => [locale, `${SITE_URL}/${locale}${path}`])),
            },
        };
    });
}
