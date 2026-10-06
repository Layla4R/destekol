import { LOCALES } from "@/lib/i18n";
import { getRequestSite } from "@/lib/request-site";
import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
    const SITE_URL = getRequestSite().url;
    const privateRoutes = ["account", "login", "forgot-password", "reset-password", "verify-email", "cart", "donate/success", "donate/cancel"];
    const disallow = ["/admin", "/api/", ...privateRoutes.flatMap(route => [`/${route}`, ...LOCALES.map(locale => `/${locale}/${route}`)])];
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow,
            },
            { userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "anthropic-ai", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "CCBot"], allow: "/", disallow },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
