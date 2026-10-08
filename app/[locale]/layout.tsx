import { getCmsBranding } from "@/lib/cms-branding";
import { getPageBySlug } from "@/lib/pageData";
import CookieBanner from "@/components/site/CookieBanner";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import SocialSidebar from "@/components/site/SocialSidebar";
import WhatsAppButton from "@/components/site/WhatsAppButton";
import { getDestekolAnswers } from "@/lib/destekol-answers";
import { normalizeDestekolBrandText } from "@/lib/destekol-brand-copy";
import { LOCALES,loadTranslations,type Locale,} from "@/lib/i18n";
import { PUBLIC_SITE_SETTINGS_SELECT,pickPublicSiteSettings,type PublicSiteSettings } from "@/lib/public-site-settings";
import { DESTEKOL_ADDRESS, DESTEKOL_REGISTRATION_NUMBER, DESTEKOL_VERIFICATION_URL } from '@/lib/public-contact';
import { getSupabaseOrNull } from "@/lib/supabase";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

// Each domain has independent CMS data; do not reuse generated HTML between sites.
export const dynamic = "force-dynamic";
const LOCALE_METADATA: Record<string, {
    title: (brand: string) => string;
    description: string;
    ogLocale: string;
}> = {
    ar: {
        title: (brand) => `${brand} | منظمة إغاثة وإنسانية دولية (Humanitarian Foundation)`,
        description: "نبني جسور العطاء ونحوّل التعاطف الإنساني إلى أثر مستدام من خلال حملات ومشاريع إنسانية شفافة.",
        ogLocale: "ar_AR",
    },
    en: {
        title: (brand) => `${brand} | International Humanitarian Foundation & Emergency Relief`,
        description: "Connects donors with transparent humanitarian campaigns and sustainable relief projects worldwide.",
        ogLocale: "en_US",
    },
    fr: {
        title: (brand) => `${brand} | Fondation Humanitaire Internationale & Secours d'Urgence`,
        description: "Relie les donateurs à des campagnes humanitaires transparentes et à des projets durables.",
        ogLocale: "fr_FR",
    },
    tr: {
        title: (brand) => `${brand} | Uluslararası İnsani Yardım Vakfı`,
        description: "Bağışçıları şeffaf insani yardım kampanyaları ve sürdürülebilir projelerle buluşturur.",
        ogLocale: "tr_TR",
    },
};
async function getDomainInfo(locale = "en") {
    const branding = await getCmsBranding(locale);
    const headerList = await headers();
    const host = headerList.get("host") || "";
    const isDestekol = true;
    const siteUrl = "https://destekol.org";
    const brandName = branding.logoText || branding.siteName || "";
    const fullName = branding.siteName || brandName;
    return { isDestekol, siteUrl, brandName, fullName };
}
export async function generateMetadata({ params, }: {
    params: {
        locale: string;
    };
}): Promise<Metadata> {
    const { locale } = params;
    const { isDestekol, siteUrl, brandName, fullName } = await getDomainInfo(locale);
    const localeData = LOCALE_METADATA[locale] ||
        LOCALE_METADATA.en;
    const currentUrl = `${siteUrl}/${locale}`;
    const rawTitleText = fullName;
    const titleText = normalizeDestekolBrandText(rawTitleText, locale);
    const description = (await getCmsBranding(locale)).footerDescription || "";
    return {
        title: {
            default: titleText,
            template: `%s | ${fullName}`,
        },
        description,
        alternates: {
            canonical: currentUrl,
            languages: {
                ar: `${siteUrl}/ar`,
                en: `${siteUrl}/en`,
                fr: `${siteUrl}/fr`,
                tr: `${siteUrl}/tr`,
                "x-default": `${siteUrl}/${"tr"}`,
            },
        },
        openGraph: {
            type: "website",
            url: currentUrl,
            siteName: fullName,
            title: titleText,
            description,
            locale: localeData.ogLocale,
        },
        twitter: {
            card: "summary_large_image",
            title: titleText,
            description,
        },
    };
}
const SLUG_TO_NAV_LABEL: Record<string, Record<string, string>> = {
    about: { ar: "من نحن", en: "About Us", fr: "À Propos", tr: "Hakkımızda" },
    "about-us": { ar: "من نحن", en: "About Us", fr: "À Propos", tr: "Hakkımızda" },
    contact: { ar: "اتصل بنا", en: "Contact", fr: "Contact", tr: "İletişim" },
    transparency: { ar: "الشفافية", en: "Transparency", fr: "Transparence", tr: "Şeffaflık" },
    "financial-transparency": { ar: "الشفافية", en: "Transparency", fr: "Transparence", tr: "Şeffaflık" },
    "how-we-work": { ar: "كيف نعمل", en: "How We Work", fr: "Comment ça marche", tr: "Nasıl Çalışırız" },
};
async function getSiteData(locale: string) {
    const supabase = getSupabaseOrNull();
    if (!supabase) {
        return {
            pages: [],
            settings: null,
            dict: {},
        };
    }
    const [pagesRes, settings, dict] = await Promise.all([
        supabase
            .from("Page")
            .select("id,slug,title")
            .eq("isPublished", true)
            .eq("showInMenu", true)
            .order("order", { ascending: true })
            .then((result) => result.data || []),
        supabase
            .from("SiteSettings")
            .select(PUBLIC_SITE_SETTINGS_SELECT)
            .eq("id", "default")
            .maybeSingle()
            .then((result) => pickPublicSiteSettings(result.data)),
        loadTranslations(locale),
    ]);
    let pages = pagesRes.map((page: any) => {
        const labels = SLUG_TO_NAV_LABEL[page.slug];
        if (!labels)
            return page;
        return {
            ...page,
            title: labels[locale] || labels.en || page.title,
        };
    });
    if (locale !== "ar" && pagesRes.length > 0) {
        try {
            const ids = pagesRes.map((page: any) => page.id);
            const { data: translations } = await supabase
                .from("PageTranslation")
                .select("pageId,title")
                .eq("locale", locale)
                .in("pageId", ids);
            if (translations?.length) {
                const translationMap: Record<string, string> = {};
                for (const translation of translations) {
                    translationMap[translation.pageId] = translation.title;
                }
                pages = pages.map((page: any) => ({
                    ...page,
                    title: translationMap[page.id] || page.title,
                }));
            }
        }
        catch {
        }
    }
    const contactPage = await getPageBySlug("contact", locale);
    const contactProps = contactPage?.sections?.find((section: any) => section.type === "contact_form")?.props || {};
    const stringValue = (value: unknown) => typeof value === "string" ? value : "";
    return { pages, settings: {
        ...settings,
        contactAddress: stringValue(contactProps.address) || DESTEKOL_ADDRESS,
        registrationNumber: stringValue(contactProps.registrationNumber) || DESTEKOL_REGISTRATION_NUMBER,
        verificationUrl: stringValue(contactProps.verificationUrl) || DESTEKOL_VERIFICATION_URL,
    }, dict };
}
function safeJsonLd(data: unknown) {
    return JSON.stringify(data).replace(/</g, "\\u003c");
}
function buildSiteSchemas(locale: string, settings: PublicSiteSettings | null, localeData: {
    description: string;
}, siteUrl: string, fullName: string, brandName: string, isDestekol: boolean) {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": ["NGO", "Organization"],
        "@id": `${siteUrl}/#organization`,
        name: fullName,
        alternateName: ["Destekol", fullName],
        url: siteUrl,
        logo: {
            "@type": "ImageObject",
            url: `${siteUrl}${"/brand/destekol-logo.png"}`,
        },
        description: settings?.footerDescription || "",
        ...({}),
        sameAs: [
            settings?.facebookUrl,
            settings?.twitterUrl,
            settings?.instagramUrl,
            settings?.linkedinUrl,
            settings?.youtubeUrl,
            ...([]),
        ].filter(Boolean),
    };
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: fullName,
        inLanguage: locale,
        publisher: { "@id": `${siteUrl}/#organization` },
    };
    return { organizationSchema, websiteSchema };
}
export default async function LocaleLayout({ children, params: { locale }, }: {
    children: React.ReactNode;
    params: {
        locale: string;
    };
}) {
    if (!LOCALES.includes(locale as Locale)) {
        notFound();
    }
    const { isDestekol, siteUrl, brandName, fullName } = await getDomainInfo(locale);
    const { pages, settings, dict } = await getSiteData(locale);
    const localeData = LOCALE_METADATA[locale] || LOCALE_METADATA.en;
    const { organizationSchema, websiteSchema } = buildSiteSchemas(locale, settings, localeData, siteUrl, fullName, brandName, isDestekol);
    const pixelId = settings?.facebookPixelId;
    const gaId = settings?.gaMeasurementId;
    // تحديد الاتجاه تلقائياً بناءً على اللغة
    const dir = locale === "ar" ? "rtl" : "ltr";
    return (<div className="flex min-h-screen flex-col" dir={dir} lang={locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationSchema) }}/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteSchema) }}/>

      <SiteHeader isDestekol={isDestekol} navItems={pages} settings={settings} locale={locale} dict={dict} transparent={false}/>
      <CookieBanner isDestekol={isDestekol} locale={locale} gaId={gaId || process.env.NEXT_PUBLIC_GA_ID} gtmId={process.env.NEXT_PUBLIC_GTM_ID} pixelId={pixelId || undefined}/>

      <main className="flex-1 pt-20">
        {children}
      </main>

      <SiteFooter isDestekol={isDestekol} navItems={pages} settings={settings} locale={locale} dict={dict}/>
      <WhatsAppButton phone={settings?.whatsappNumber} locale={locale}/>

      <SocialSidebar locale={locale} whatsapp={settings?.whatsappNumber} facebook={settings?.facebookUrl} twitter={settings?.twitterUrl} instagram={settings?.instagramUrl} tiktok={settings?.tiktokUrl} youtube={settings?.youtubeUrl} linkedin={settings?.linkedinUrl} position={(settings?.socialPosition as "left" | "right") || "right"}/>
    </div>);
}
