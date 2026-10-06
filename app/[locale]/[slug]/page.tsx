import { getCmsBranding } from "@/lib/cms-branding";
import { mergeCmsTranslation } from "@/lib/cms-localization";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import Icon from "@/components/icons";
import DestekolPageIntro from "@/components/site/DestekolPageIntro";
import LegalPageContent from "@/components/site/LegalPageContent";
import ProjectArticleLayout from "@/components/site/ProjectArticleLayout";
import { PageSection } from "@/lib/blocks";
import { normalizeDestekolBrandCopy,normalizeDestekolBrandText } from "@/lib/destekol-brand-copy";
import { LOCALES,loadTranslations } from "@/lib/i18n";
import { getCampaignsLite } from "@/lib/pageData";
import { getPolicyMetadata } from "@/lib/policy-metadata";
import { normalizePublicContact,officialEmail } from "@/lib/public-contact";
import { getSupabaseOrNull } from "@/lib/supabase";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
export const revalidate = 0;
interface PageProps {
    params: {
        slug: string;
        locale: string;
    };
}
// دالة مساعدة لجلب معلومات الدومين
async function getDomainContext(locale = "en") {
    const branding = await getCmsBranding();
    const isDestekol = true;
    const siteUrl = "https://destekol.org";
    const brandName = branding.logoText || branding.siteName || "";
    const fullName = branding.siteName || brandName;
    return { isDestekol, siteUrl, brandName, fullName };
}
const LEGAL_SLUGS = [
    "privacy",
    "terms",
    "refund-policy",
    "cookie-policy",
    "aml-policy",
    "complaints",
    "license",
    "financial-transparency",
    "how-we-use-donations",
];
const LEGAL_TITLES: Record<string, Record<string, string>> = {
    privacy: {
        ar: "سياسة الخصوصية",
        en: "Privacy Policy",
        fr: "Politique de Confidentialité",
        tr: "Gizlilik Politikası",
    },
    terms: {
        ar: "الشروط والأحكام",
        en: "Terms & Conditions",
        fr: "Conditions d'Utilisation",
        tr: "Kullanım Koşulları",
    },
    "refund-policy": {
        ar: "سياسة الاسترداد",
        en: "Refund Policy",
        fr: "Politique de Remboursement",
        tr: "İade Politikası",
    },
    "cookie-policy": {
        ar: "سياسة ملفات تعريف الارتباط",
        en: "Cookie Policy",
        fr: "Politique des Cookies",
        tr: "Çerez Politikası",
    },
    "aml-policy": {
        ar: "سياسة مكافحة غسيل الأموال",
        en: "Anti-Money Laundering Policy",
        fr: "Politique Anti-Blanchiment",
        tr: "Kara Para Aklamayla Mücadele",
    },
    complaints: {
        ar: "الشكاوى",
        en: "Complaints Policy",
        fr: "Politique de Réclamations",
        tr: "Şikayet Politikası",
    },
    "financial-transparency": {
        ar: "الشفافية المالية",
        en: "Financial Transparency",
        fr: "Transparence Financière",
        tr: "Mali Şeffاflık",
    },
    "how-we-use-donations": {
        ar: "كيف نستخدم التبرعات",
        en: "How We Use Donations",
        fr: "Comment Nous Utilisons les Dons",
        tr: "Bağışları Nasıl Kullanıyoruz",
    },
};
function getLegalSubtitle(slug: string, locale: string, brandName: string): string | null {
    const subtitles: Record<string, Record<string, string>> = {
        privacy: {
            ar: "حماية بياناتك وخصوصيتك أولوية بالنسبة لنا.",
            en: "Protecting your personal data and privacy is our priority.",
            fr: "La protection de vos données personnelles et de votre vie privée est notre priorité.",
            tr: "Kişisel verilerinizi ve gizliliğinizi korumak önceliğimizdir.",
        },
        terms: {
            ar: `الشروط والأحكام المنظمة لاستخدام منصة ${brandName}.`,
            en: `The terms and conditions governing the use of the ${brandName} platform.`,
            fr: `Les conditions générales régissant l'utilisation de la plateforme ${brandName}.`,
            tr: `${brandName} platformunun kullanımını düzenleyen hüküm ve koşullar.`,
        },
    };
    return subtitles[slug]?.[locale] || subtitles[slug]?.en || null;
}
function getCommonPageTitle(slug: string, locale: string, fullName: string, brandName: string): string | null {
    const titles: Record<string, Record<string, string>> = {
        about: {
            ar: "من نحن",
            en: "About Us",
            fr: "À propos",
            tr: "Hakkımızda",
        },
        "about-us": {
            ar: "من نحن",
            en: "About Us",
            fr: "À propos",
            tr: "Hakkımızda",
        },
        "our-work": {
            ar: "مجالات عملنا",
            en: "Our Sectors & Work",
            fr: "Nos Domaines d'Action",
            tr: "Faaliyet Alanlarımız",
        },
        sectors: {
            ar: "مجالات عملنا",
            en: "Our Sectors",
            fr: "Nos Secteurs",
            tr: "Faaliyet Alanlarımız",
        },
        projects: {
            ar: `مشاريعنا | ${brandName}`,
            en: `Our Projects | ${brandName}`,
            fr: `Nos Projets | ${brandName}`,
            tr: `Projelerimiz | ${brandName}`,
        },
        partnerships: {
            ar: `الشراكات المؤسسية | ${fullName}`,
            en: `Corporate Partnerships | ${fullName}`,
            fr: `Partenariats Corporate | ${fullName}`,
            tr: `Kurumsal Ortaklıklar | ${fullName}`,
        },
        transparency: {
            ar: `الشفافية والتقارير المالية`,
            en: `Financial Transparency`,
            fr: `Transparence Financière`,
            tr: `Mali Şeffaflık`,
        },
        contact: {
            ar: `اتصل بنا | ${fullName}`,
            en: `Contact Us | ${fullName}`,
            fr: `Contactez-nous | ${fullName}`,
            tr: `İletişim | ${brandName}`,
        },
    };
    return titles[slug]?.[locale] || null;
}
function cleanText(value: unknown): string {
    if (typeof value !== "string")
        return "";
    return value
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function parseGalleryImages(galleryData: any): string[] {
    if (!galleryData)
        return [];
    if (Array.isArray(galleryData)) {
        return galleryData.filter((item) => typeof item === "string" && item.trim() !== "");
    }
    if (typeof galleryData === "string") {
        try {
            const parsed = JSON.parse(galleryData);
            if (Array.isArray(parsed)) {
                return parsed.filter((item) => typeof item === "string" && item.trim() !== "");
            }
        }
        catch {
            if (galleryData.startsWith("http"))
                return [galleryData];
        }
    }
    return [];
}
function getSchemaType(slug: string) {
    if (slug === "about" || slug === "about-us")
        return "AboutPage";
    if (slug === "contact")
        return "ContactPage";
    if (slug === "our-work" || slug === "sectors" || slug === "projects")
        return "CollectionPage";
    return "WebPage";
}
// 🌟 دالة جلب البيانات مع استخراج الحقول الجديدة من قاعدة البيانات مباشرة
async function getFullPageData(slug: string, locale: string) {
    const supabase = getSupabaseOrNull();
    if (!supabase)
        return null;
    const { data: page } = await supabase
        .from("Page")
        .select("*")
        .eq("slug", slug)
        .eq("isPublished", true)
        .maybeSingle();
    if (!page)
        return null;
    let title = page.title;
    let description = page.description || "";
    let body = page.body || page.content || "";
    let body2 = page.body2 || "";
    let body3 = page.body3 || "";
    let coverImage = page.coverImage || page.image || null;
    let secondaryImage = page.secondaryImage || null;
    let gallery = parseGalleryImages(page.gallery);
    let videoUrl = page.videoUrl || null;
    let sections = page.sections || [];
    if (locale !== "ar") {
        const { data: translation } = await supabase
            .from("PageTranslation")
            .select("*")
            .eq("pageId", page.id)
            .eq("locale", locale)
            .maybeSingle();
        if (translation) {
            if (translation.title)
                title = translation.title;
            if (translation.description != null)
                description = translation.description;
            if (translation.body || translation.content)
                body = translation.body || translation.content;
            if (translation.body != null)
                body = translation.body;
            if (translation.body2 != null)
                body2 = translation.body2;
            if (translation.body3 != null)
                body3 = translation.body3;
            if (translation.coverImage != null)
                coverImage = translation.coverImage;
            if (translation.secondaryImage != null)
                secondaryImage = translation.secondaryImage;
            if (translation.gallery != null)
                gallery = parseGalleryImages(translation.gallery);
            if (translation.videoUrl != null)
                videoUrl = translation.videoUrl;
            if (translation.sections)
                sections = mergeCmsTranslation(page.sections || [], translation.sections);
        }
    }
    const result = {
        ...page,
        title,
        description,
        body,
        body2,
        body3,
        coverImage,
        secondaryImage,
        gallery,
        videoUrl,
        sections,
    };
    return normalizeDestekolBrandCopy(result, locale);
}
export async function generateMetadata({ params, }: {
    params: {
        slug: string;
        locale: string;
    };
}): Promise<Metadata> {
    const { slug, locale } = params;
    const { siteUrl, brandName, fullName } = await getDomainContext(locale);
    const page = await getFullPageData(slug, locale);
    if (!page)
        return {};
    const isLegalPage = LEGAL_SLUGS.includes(slug);
    const commonTitle = getCommonPageTitle(slug, locale, fullName, brandName);
    const baseTitle = cleanText(page.title) || fullName;
    const title = baseTitle.includes(brandName)
        ? baseTitle
        : `${baseTitle} | ${fullName}`;
    const description = cleanText(page.description) || title;
    const currentUrl = `${siteUrl}/${locale}/${slug}`;
    return {
        title,
        description,
        alternates: {
            canonical: currentUrl,
            languages: Object.fromEntries(LOCALES.map((currentLocale) => [
                currentLocale,
                `${siteUrl}/${currentLocale}/${slug}`,
            ])),
        },
        openGraph: {
            type: "website",
            url: currentUrl,
            siteName: fullName,
            title,
            description,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}
export default async function DynamicPage({ params, }: {
    params: {
        slug: string;
        locale: string;
    };
}) {
    const { slug, locale } = params;
    const { isDestekol, siteUrl, brandName, fullName } = await getDomainContext(locale);
    ;
    const supabase = getSupabaseOrNull();
    const [appearanceResult, page, campaigns, dict] = await Promise.all([
        supabase
            ? supabase
                .from("SiteSettings")
                .select("primaryColor, accentColor, facebookUrl, twitterUrl, instagramUrl, linkedinUrl, youtubeUrl")
                .eq("id", "default")
                .maybeSingle()
            : Promise.resolve({ data: null }),
        getFullPageData(slug, locale),
        getCampaignsLite(locale),
        loadTranslations(locale),
    ]);
    if (!page) {
        notFound();
    }
    const isAr = locale === "ar";
    const isLegalPage = LEGAL_SLUGS.includes(slug);
    const isDestekolAboutPage = ["about", "about-us"].includes(slug);
    // 🌟 التوجيه المباشر للتصميم الصحفي إذا احتوت الصفحة على نصوص أو ميديا المشروع
    const hasProjectArticleContent = !isLegalPage &&
        !isDestekolAboutPage &&
        Boolean(page.body || page.body2 || page.body3 || page.coverImage || page.videoUrl || page.secondaryImage || (Array.isArray(page.gallery) && page.gallery.length > 0));
    if (hasProjectArticleContent) {
        const p = `/${locale}`;
        return (<>
        {<DestekolPageIntro locale={locale} title={page.title} description={cleanText(page.description) || null}/>}
        <ProjectArticleLayout hideHeader={isDestekol} data={{
                title: page.title,
                excerpt: page.description || "",
                body: page.body || "",
                body2: page.body2 || "",
                body3: page.body3 || "",
                coverImage: page.coverImage || null,
                secondaryImage: page.secondaryImage || null,
                gallery: page.gallery || [],
                videoUrl: page.videoUrl || null,
                publishedAtISO: page.createdAt || new Date().toISOString(),
                updatedAtISO: page.updatedAt || new Date().toISOString(),
                authorName: isAr ? "فريق المتابعة والتوثيق الميداني" : "Field Monitoring Team",
                trustBadge: "",
            }} context={{
                locale,
                dict,
                isAr,
                brandName: fullName,
                backLink: `${p}/projects`,
                backText: dict["projects.back"] || (isAr ? "العودة إلى المشاريع" : "Back to Projects"),
                categoryLabel: isAr ? "مشروع إغاثي ميداني" : "Relief Project",
                donateUrl: `${p}/donate`,
            }}/>
      </>);
    }
    // ⬇️ جميع الكود القديم للصفحات العادية والأنظمة بدون حذف ⬇️
    const appearance = appearanceResult.data;
    const primaryColor = appearance?.primaryColor || "#0069D2";
    const accentColor = appearance?.accentColor || "#F00F5A";
    const rawSections = (page.sections as unknown as PageSection[]) || [];
    const visibleSections = rawSections.filter((section) => !["hero", "destekol_achievements"].includes(section.type));
    const sections = visibleSections.map((sec, idx) => ({
        ...sec,
        id: sec.id || `section-${idx}`,
    }));
    const isTrustPage = !isLegalPage && (slug === "about" ||
        slug === "about-us" ||
        slug === "our-work" ||
        slug === "sectors" ||
        slug === "transparency" ||
        slug === "financial-transparency");
    const showTrustCredentials = isTrustPage && !isDestekolAboutPage;
    const hasCustomSections = !isLegalPage && sections.length > 0;
    const commonTitle = getCommonPageTitle(slug, locale, fullName, brandName);
    const rawDisplayTitle = cleanText(page.title) || fullName;
    const transparencySubtitles: Record<string, string> = {
        ar: "تقارير الشفافية المالية لمنصة Destekol.",
        en: "Financial transparency reports of Destekol.",
        fr: "Rapports de transparence financière de Destekol.",
        tr: "Destekol kâr amacı gütmeyen hayır derneğinin mali şeffaflık raporları.",
    };
    const workSubtitles: Record<string, string> = {
        ar: "تعرّف على مجالات عمل Destekol في الاستجابة الإنسانية والصحة والمياه النظيفة والتمكين الاقتصادي وسبل العيش.",
        en: "Discover Destekol's areas of work in humanitarian response, health, clean water, economic empowerment, and livelihoods.",
        fr: "Découvrez les domaines d'action de Destekol dans l'aide humanitaire, la santé, l'eau potable, l'autonomisation économique et les moyens de subsistance.",
        tr: "Destekol'un insani yardım, sağlık, temiz su, ekonomik güçlendirme ve geçim kaynakları alanlarındaki çalışmalarını keşfedin.",
    };
    const rawDisplaySubtitle = cleanText(page.description) || null;
    const displayTitle = normalizeDestekolBrandText(rawDisplayTitle, locale);
    const displaySubtitle = rawDisplaySubtitle ? normalizeDestekolBrandText(rawDisplaySubtitle, locale) : rawDisplaySubtitle;
    const pageUrl = `${siteUrl}/${locale}/${slug}`;
    const schemaType = getSchemaType(slug);
    const dynamicPageSchema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": schemaType,
                "@id": `${pageUrl}/#webpage`,
                url: pageUrl,
                name: `${displayTitle} | ${fullName}`,
                description: displaySubtitle || displayTitle,
                inLanguage: locale,
                datePublished: (page as any).createdAt || "2026-01-01T00:00:00Z",
                dateModified: (page as any).updatedAt || new Date().toISOString(),
                isPartOf: { "@id": `${siteUrl}/#website` },
                about: { "@id": `${siteUrl}/#organization` },
                publisher: { "@id": `${siteUrl}/#organization` },
                breadcrumb: { "@id": `${pageUrl}/#breadcrumb` },
            },
            ...(isTrustPage
                ? [
                    {
                        "@type": ["NGO", "Organization"],
                        "@id": `${siteUrl}/#organization`,
                        name: fullName,
                        alternateName: ["Destekol", fullName],
                        url: siteUrl,
                        logo: `${siteUrl}${"/brand/desekol_logo.png"}`,
                        foundingDate: "2026",
                        knowsAbout: [
                            "Humanitarian Aid",
                            "Emergency Relief",
                            "Financial Transparency",
                            "Sustainable Development",
                            "WASH Projects",
                            "Zakat",
                        ],
                        sameAs: [
                            appearance?.facebookUrl,
                            appearance?.twitterUrl,
                            appearance?.instagramUrl,
                            appearance?.linkedinUrl,
                            appearance?.youtubeUrl,
                            "https://find-and-update.company-information.service.gov.uk/",
                        ].filter(Boolean),
                    },
                ]
                : []),
        ],
    };
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}/#breadcrumb`,
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: dict["nav.home"] || (isAr ? "الرئيسية" : "Home"),
                item: `${siteUrl}/${locale}`,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: displayTitle,
                item: pageUrl,
            },
        ],
    };
    return (<article className="bg-white min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{
            __html: JSON.stringify(dynamicPageSchema).replace(/</g, "\\u003c"),
        }}/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c"),
        }}/>

      {false}
      {(<DestekolPageIntro locale={locale} title={displayTitle} description={displaySubtitle}/>)}

      

      <div className="bg-white py-6">
        {hasCustomSections ? (sections.map((section, index) => (<BlockRenderer key={section.id} section={section} context={{
                isDestekol,
                isDestekolAboutPage,
                aboutRowIndex: sections.slice(0, index).filter((item) => item.type === section.type).length,
                campaigns,
                whiteBackground: true,
                locale,
                dict,
                primaryColor,
                accentColor,
            }}/>))) : (page as any).content ? (<div className="mx-auto max-w-screen-xl px-6 py-8 whitespace-pre-line text-slate-700 leading-relaxed text-base sm:text-lg">
            {normalizePublicContact((page as any).content, officialEmail(isDestekol))}
          </div>) : null}
      </div>
    </article>);
}
