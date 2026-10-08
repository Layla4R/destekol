import ConsentEmbed from "@/components/site/ConsentEmbed";
import { getPageBySlug } from "@/lib/pageData";
import { mergeCmsTranslation } from "@/lib/cms-localization";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import ContactForm from "@/components/blocks/ContactForm";
import Icon from "@/components/icons";
import DestekolPageIntro from "@/components/site/DestekolPageIntro";
import { getDestekolOrganizationName,normalizeDestekolBrandCopy,normalizeDestekolBrandText } from "@/lib/destekol-brand-copy";
import { loadTranslations,LOCALES } from "@/lib/i18n";
import { DESTEKOL_ADDRESS,launchCopy,normalizePublicContact,officialEmail } from "@/lib/public-contact";
import { getRequestSite } from "@/lib/request-site";
import { getSupabaseOrNull } from "@/lib/supabase";
import type { Metadata } from "next";
export const revalidate = 0;
export async function generateMetadata({ params: { locale }, }: {
    params: {
        locale: string;
    };
}): Promise<Metadata> {
    const site = getRequestSite();
    const SITE_URL = site.url;
    const supabase = getSupabaseOrNull();
    // جلب اسم الموقع/البراند ديناميكياً من إعدادات المنصة
    const { data: settings } = (await supabase
        ?.from("SiteSettings")
        .select("siteName")
        .eq("id", "default")
        .maybeSingle()) || { data: null };
    const url = `${SITE_URL}/${locale}/contact`;
    // تحديد اسم البراند حسب اللغة الممررة أو من الإعدادات
    const brandName = settings?.siteName || "";
    // العناوين المترجمة (Title)
    const titles: Record<string, string> = {
        ar: `اتصل بنا | ${brandName}`,
        en: `Contact Us | ${brandName}`,
        fr: `Nous Contacter | ${brandName}`,
        tr: `Bize Ulaşın | ${brandName}`,
    };
    // الأوصاف المترجمة (Description)
    const cmsPage = await getPageBySlug("contact", locale);
    const title = titles[locale] || titles.en;
    const description = cmsPage?.description || "";
    return {
        title,
        description,
        alternates: {
            canonical: url,
            languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/contact`])),
        },
        openGraph: {
            type: "website",
            url,
            siteName: brandName,
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
export default async function ContactPage({ params: { locale }, }: {
    params: {
        locale: string;
    };
}) {
    const site = getRequestSite();
    const SITE_URL = site.url;
    const isDestekol = true;
    const dict = await loadTranslations(locale);
    const supabase = getSupabaseOrNull();
    const t = (ar: string, en: string, fr: string, tr: string) => locale === "ar" ? ar : locale === "fr" ? fr : locale === "tr" ? tr : en;
    // 1. جلب الإعدادات الأساسية والصفحة الرئيسية
    const [{ data: settings }, { data: appearance }, { data: pageData }] = await Promise.all([
        supabase
            ?.from("SiteSettings")
            .select("siteName,logoText,logoImage,contactEmail,contactPhone,whatsappNumber,facebookUrl,twitterUrl,instagramUrl,linkedinUrl,youtubeUrl")
            .eq("id", "default")
            .maybeSingle() || { data: null },
        supabase
            ?.from("SiteSettings")
            .select("primaryColor,accentColor")
            .eq("id", "default")
            .maybeSingle() || { data: null },
        supabase
            ?.from("Page")
            .select("id, title, description, sections")
            .eq("slug", "contact")
            .maybeSingle() || { data: null },
    ]);
    ;
    // 2. جلب الأقسام المترجمة من جدول PageTranslation إذا كانت اللغة ليست العربية
    let sections: any[] = Array.isArray(pageData?.sections) ? pageData.sections : [];
    let pageTitle = pageData?.title || t("تواصل معنا", "Contact Us", "Nous Contacter", "Bize Ulaşın");
    let pageDescription = pageData?.description || "";
    if (pageData?.id && locale !== "ar" && supabase) {
        const { data: translation } = await supabase
            .from("PageTranslation")
            .select("title, description, sections")
            .eq("pageId", pageData.id)
            .eq("locale", locale)
            .maybeSingle();
        if (translation?.sections && Array.isArray(translation.sections) && translation.sections.length > 0) {
            sections = mergeCmsTranslation(pageData.sections || [], translation.sections);
        }
        if (translation?.title)
            pageTitle = translation.title;
        if (translation?.description)
            pageDescription = translation.description;
    }
    {
        ({ title: pageTitle, description: pageDescription, sections } = normalizeDestekolBrandCopy({
            title: pageTitle,
            description: pageDescription,
            sections,
        }, locale));
    }
    ;
    const primaryColor = appearance?.primaryColor || "var(--color-brand, #0069D2)";
    const accentColor = appearance?.accentColor || "var(--color-accent, #F00F5A)";
    const contactProps = sections.find((section: any) => section.type === "contact_form")?.props || {};
    const contactEmail = settings?.contactEmail || contactProps.email || "";
    const street = contactProps.address?.trim() || DESTEKOL_ADDRESS;
    const locality = contactProps.locality || "";
    const country = contactProps.country || "";
    const contactPhone = settings?.contactPhone || settings?.whatsappNumber || "";
    const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(street)}&z=15&output=embed`;
    const pageUrl = `${SITE_URL}/${locale}/contact`;
    // استخراج أسئلة الـ FAQ المترجمة لبناء الـ Schema
    const faqSection = sections.find((s: any) => s.type?.toLowerCase() === "faq");
    const rawFaqItems: Array<{
        question?: string;
        q?: string;
        title?: string;
        answer?: string;
        a?: string;
        content?: string;
        body?: string;
    }> = faqSection?.props?.items || faqSection?.data?.items || faqSection?.items || [];
    const faqItems = normalizeDestekolBrandCopy(rawFaqItems, locale);
    const contactSchema: any = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "ContactPage",
                "@id": `${pageUrl}/#webpage`,
                url: pageUrl,
                name: t("تواصل معنا", "Contact Us", "Nous Contacter", "Bize Ulaşın"),
                description: pageDescription,
                inLanguage: locale,
                mainEntity: { "@id": `${SITE_URL}/#organization` },
            },
            {
                "@type": ["Organization", "NGO"],
                "@id": `${SITE_URL}/#organization`,
                name: (settings?.siteName || ""),
                alternateName: site.name,
                url: SITE_URL,
                logo: `${SITE_URL}/brand/${"destekol-logo.png"}`,
                email: contactEmail,
                telephone: contactPhone,
                address: {
                    "@type": "PostalAddress",
                    streetAddress: street,
                    addressLocality: locality,
                    ...({}),
                    addressCountry: country,
                },
                contactPoint: [
                    {
                        "@type": "ContactPoint",
                        telephone: contactPhone,
                        email: contactEmail,
                        contactType: "customer service",
                        availableLanguage: ["Arabic", "English", "French", "Turkish"],
                        areaServed: "Worldwide",
                    },
                ],
                sameAs: [
                    settings?.facebookUrl,
                    settings?.twitterUrl,
                    settings?.instagramUrl,
                    settings?.linkedinUrl,
                    settings?.youtubeUrl,
                ].filter(Boolean),
            },
        ],
    };
    if (faqItems.length > 0) {
        contactSchema["@graph"].push({
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.q || item.question || item.title || "",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: item.a || item.answer || item.content || item.body || "",
                },
            })),
        });
    }
    const safeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
    const rendererContext = { settings: { contactEmail }, isDestekol, isDestekolContactPage: isDestekol, locale, dict, primaryColor, accentColor };
    const contactBlock = sections.find((section: any) => section.type === "contact_form");
    const directContactTitle = contactBlock?.props?.contactHeading || contactBlock?.data?.contactHeading;
    return (<div className={"destekol-contact-page min-h-screen pb-12"}>
      {<DestekolPageIntro locale={locale} title={pageTitle} description={pageDescription}/>}
      {false}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(contactSchema) }}/>

      {/* Header Banner */}
      {false}

      <div className={"destekol-contact-details"}>
        {/* Direct Summary Block (SEO / E-E-A-T) */}
        <section aria-label="Direct Contact Summary" itemScope itemType="http://schema.org/Organization" className={"destekol-contact-summary"}>
          <meta itemProp="name" content={(settings?.siteName || "")}/>

          <div className={"destekol-contact-heading"}>
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <Icon name="shield-check" size={18}/>
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                {directContactTitle || t("تواصل معنا مباشرة", "Get in touch directly", "Contactez-nous directement", "Bizimle doğrudan iletişime geçin")}
              </h2>
              <p className="text-xs text-slate-700">
                {contactBlock?.props?.contactSummary || ""}
              </p>
            </div>
          </div>

          <div className={"destekol-contact-cards"}>
            <div>
              {<div className="destekol-contact-icon"><Icon name="mail" size={28}/></div>}
              <span className="block text-slate-700 mb-0.5">
                {t("البريد الرسمي", "Official Email", "Email Officiel", "Resmi E-posta")}
              </span>
              <a href={`mailto:${contactEmail}`} itemProp="email" className="text-slate-900 font-bold truncate block hover:text-brand">
                {contactEmail}
              </a>
            </div>
            <div>
              {<div className="destekol-contact-icon"><Icon name="phone" size={28}/></div>}
              <span className="block text-slate-700 mb-0.5">
                {t("الهاتف والواتساب", "Phone / WhatsApp", "Téléphone / WhatsApp", "Telefon / WhatsApp")}
              </span>
              {contactPhone ? <a href={`tel:${contactPhone}`} itemProp="telephone" className="text-slate-900 font-bold block hover:text-brand">
                <span dir="ltr">{contactPhone}</span>
              </a> : <span>{contactEmail}</span>}
              {false}
            </div>
            <div>
              {<div className="destekol-contact-icon"><Icon name="map-pin" size={28}/></div>}
              <span className="block text-slate-700 mb-0.5">
                {t("المقر الرئيسي", "Headquarters", "Siège Social", "Genel Merkez")}
              </span>
              <strong className="text-slate-900 block break-words" itemProp="address" itemScope itemType="http://schema.org/PostalAddress">
                <span itemProp="streetAddress" dir="ltr">{street}</span>
                {(locality || country) && <><br /><span>{[locality, country].filter(Boolean).join(', ')}</span></>}
              </strong>
            </div>
          </div>
        </section>
        {contactProps.notice && <section className="destekol-contact-notice" aria-label="Official contact"><p>{contactProps.notice}</p></section>}
      </div>

      {/* عرض الأقسام المترجمة عبر BlockRenderer */}
      {sections.length > 0 ? (<div className="space-y-4">
          {sections.map((section: any, idx: number) => section.type === "faq" ? (<div key={section.id || idx} className="destekol-contact-faq">
              <BlockRenderer section={section} context={rendererContext}/>
            </div>) : <BlockRenderer key={section.id || idx} section={section} context={rendererContext}/>)}
        </div>) : (
        /* Fallback Layout */
        <div className="max-w-screen-xl mx-auto px-6 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                <h2 className="font-display text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">
                  {t("معلومات التواصل", "Contact Information", "Informations de Contact", "İletişim Bilgileri")}
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 group p-3 rounded-2xl hover:bg-slate-50 transition">
                    <div className="w-11 h-11 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition mt-1">
                      <Icon name="map-pin" size={20}/>
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-[11px] text-slate-700 font-semibold uppercase tracking-wider mb-1">
                        {t("العنوان المسجل", "Registered Address", "Adresse Enregistrée", "Kayıtlı Adres")}
                      </div>
                      <address itemScope itemType="http://schema.org/PostalAddress" className="not-italic text-slate-800 font-bold text-xs sm:text-sm group-hover:text-brand transition whitespace-normal leading-relaxed">
                        <span itemProp="streetAddress">{street}</span><br />
                        <span itemProp="addressLocality">{locality}</span>, {false}<br />
                        <span itemProp="addressCountry">{country}</span>
                      </address>
                    </div>
                  </div>
                  <a href={`mailto:${contactEmail}`} aria-label={contactEmail} className="flex items-center gap-4 group p-3 rounded-2xl hover:bg-slate-50 transition">
                    <div className="w-11 h-11 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition">
                      <Icon name="mail" size={20}/>
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-[11px] text-slate-700 font-semibold uppercase tracking-wider mb-0.5">
                        {t("البريد الإلكتروني", "Email", "Email", "E-posta")}
                      </div>
                      <div className="text-slate-800 font-bold text-xs sm:text-sm group-hover:text-brand transition truncate">
                        {contactEmail}
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
                <ContactForm locale={locale} dict={dict} email={contactEmail}/>
              </div>
            </div>
          </div>
        </div>)}

      {/* Google Maps Section */}
      <div className="max-w-screen-xl mx-auto px-6 pt-8 pb-10">
        <div className="bg-white p-2 sm:p-3 rounded-[2rem] border border-slate-100 shadow-sm">
          {street && <ConsentEmbed src={mapEmbedUrl} width="100%" height="400" className="border-0 rounded-3xl w-full grayscale-[20%] contrast-125 transition-all hover:grayscale-0" allowFullScreen={true} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={street}/>}
        </div>
      </div>
    </div>);
}
