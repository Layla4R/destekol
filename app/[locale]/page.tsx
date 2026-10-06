import BlockRenderer from "@/components/blocks/BlockRenderer"; // استيراد BlockRenderer
import ChatWidget from "@/components/site/ChatWidget";
import { getDestekolAnswers } from "@/lib/destekol-answers";
import { loadTranslations } from "@/lib/i18n";
import { officialEmail } from "@/lib/public-contact";
import { getHomeData } from "@/lib/services/home.service";
import type { Metadata } from "next";
import { headers } from "next/headers";
export const revalidate = 300;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://destekol.org";
interface PageProps {
    params: {
        locale: string;
    };
}
const OPTIMIZED_HOME_TITLES: Record<string, string> = {
    ar: "Destekol | منظمة إغاثة وإنسانية دولية (Humanitarian Foundation)",
    en: "Destekol | International Humanitarian Foundation & Emergency Relief",
    fr: "Destekol | Fondation Humanitaire Internationale & Secours d'Urgence",
    tr: "Destekol | Uluslararası İnsani Yardım Vakfı",
};
const DESTEKOL_IDENTITY: Record<string, string> = {
    ar: "جمعية Destekol الخيرية غير الربحية",
    en: "Destekol Charitable Non-Profit Association",
    fr: "Association caritative Destekol à but non lucratif",
    tr: "Destekol kâr amacı gütmeyen hayır derneği",
};
function cleanSchemaText(value: unknown): string {
    if (typeof value !== "string")
        return "";
    return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = params;
    const headerList = await headers();
    const host = headerList.get("host") || "";
    const isDestekol = true;
    const siteUrl = "https://destekol.org";
    let identity = "";
    const [dict, data] = await Promise.all([
        loadTranslations(locale),
        getHomeData(locale),
    ]);
    const settings: any = data?.settings || {};
    identity = settings.siteName || data?.page?.title || "";
    const siteTitle = (cleanSchemaText(data?.page?.title) || identity);
    const description = (cleanSchemaText(data?.page?.description));
    const currentUrl = `${siteUrl}/${locale}`;
    return {
        title: { absolute: siteTitle },
        description,
        alternates: {
            canonical: currentUrl,
            languages: { ...Object.fromEntries(["ar", "en", "fr", "tr"].map(language => [language, `${siteUrl}/${language}`])), "x-default": `${siteUrl}/${"tr"}` },
        },
        openGraph: {
            type: "website",
            url: currentUrl,
            siteName: identity,
            title: siteTitle,
            description,
        },
        twitter: {
            card: "summary_large_image",
            title: siteTitle,
            description,
        },
    };
}
export default async function HomePage({ params }: PageProps) {
    const { locale } = params;
    const headerList = await headers();
    const host = headerList.get("host") || "";
    const isDestekol = true;
    const siteUrl = "https://destekol.org";
    let identity = "";
    const [dict, homeData] = await Promise.all([
        loadTranslations(locale),
        getHomeData(locale),
    ]);
    const data: any = homeData || {};
    const settings: any = data.settings || {};
    identity = settings.siteName || data.page?.title || "";
    const campaigns = data.campaigns || [];
    const posts = data.posts || [];
    const stats = data.stats || { total: 0, families: 0 };
    const pageSections = data.pageSections || [];
    const rawSections = Array.isArray(pageSections) ? pageSections : [];
    const sections = rawSections.filter((section: any) => section.type !== "projects");
    const primaryColor = settings?.primaryColor || "#0069D2";
    const accentColor = settings?.accentColor || "#F00F5A";
    const pageUrl = `${siteUrl}/${locale}`;
    const description = (cleanSchemaText(data.page?.description));
    const publishedDateISO = data.page?.createdAt;
    const updatedDateISO = data.page?.updatedAt;
    const homeSchema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": `${pageUrl}/#webpage`,
                url: pageUrl,
                name: (cleanSchemaText(data.page?.title) || identity),
                description,
                inLanguage: locale,
                ...(publishedDateISO ? { datePublished: publishedDateISO } : {}),
                ...(updatedDateISO ? { dateModified: updatedDateISO } : {}),
                author: { "@id": `${siteUrl}/#organization` },
                isPartOf: { "@id": `${siteUrl}/#website` },
                about: { "@id": `${siteUrl}/#organization` },
                publisher: { "@id": `${siteUrl}/#organization` },
            },
            {
                "@type": ["NGO", "Organization"],
                "@id": `${siteUrl}/#organization`,
                name: identity,
                alternateName: ["Destekol", identity],
                url: siteUrl,
                ...({}),
                logo: {
                    "@type": "ImageObject",
                    url: `${siteUrl}${"/brand/destekol-logo.png"}`,
                },
                ...({}),
                knowsAbout: [
                    "Humanitarian Relief",
                    "Emergency Aid",
                    "Financial Governance",
                    "Zakat Inquiries",
                ],
                contactPoint: {
                    "@type": "ContactPoint",
                    email: officialEmail(isDestekol),
                    contactType: "customer support",
                    availableLanguage: ["Arabic", "English", "French", "Turkish"],
                },
            },
        ],
    };
    const safeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
    // تمرير السياق المطلوب للـ BlockRenderer
    const context = {
        isHomePage: true,
        locale,
        dict,
        primaryColor,
        accentColor,
        campaigns,
        kindnessCampaigns: data.kindnessCampaigns || [],
        posts,
        stats,
        settings,
        isDestekol,
    };
    return (<div className="home-layout">
      <script type="application/ld+json" dangerouslySetInnerHTML={{
            __html: safeJsonLd(homeSchema),
        }}/>

      {/* استخدام BlockRenderer لتصيير جميع الأقسام ديناميكياً */}
      {sections.map((section: any) => (<div key={section.id} className={`home-section home-section--${section.type}`}><BlockRenderer section={section} context={context}/></div>))}
      
      {false}
      

      {/* عرض مكون الدردشة بشكل منفصل إذا كان يجب أن يظهر دائماً */}
      <ChatWidget key={locale} locale={locale}/>
    </div>);
}
