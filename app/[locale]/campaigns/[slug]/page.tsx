import { getCmsBranding } from "@/lib/cms-branding";
import CampaignCard from "@/components/blocks/CampaignCard";
import Icon from "@/components/icons";
import DestekolPageIntro from "@/components/site/DestekolPageIntro";
import { categoryMeta } from "@/lib/categories";
import { getDestekolOrganizationName,normalizeDestekolBrandCopy } from "@/lib/destekol-brand-copy";
import { formatCurrency } from "@/lib/format";
import { loadTranslations,LOCALES } from "@/lib/i18n";
import { getRequestSite } from "@/lib/request-site";
import { getCampaignDetails } from "@/lib/services/campaign.service";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
export const revalidate = 300;
function cleanText(value: unknown): string {
    if (typeof value !== "string")
        return "";
    return value
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
export async function generateMetadata({ params, }: {
    params: {
        slug: string;
        locale: string;
    };
}): Promise<Metadata> {
    const campaign = await getCampaignDetails(params.slug, params.locale);
    if (!campaign) {
        return {};
    }
    const isDestekol = true;
    const displayCampaign = normalizeDestekolBrandCopy(campaign, params.locale);
    const siteUrl = getRequestSite().url;
    const url = `${siteUrl}/${params.locale}/campaigns/${displayCampaign.slug}`;
    const image = displayCampaign.coverImage || `${siteUrl}/brand/${"destekol-logo.png"}`;
    const title = displayCampaign.displayTitle || displayCampaign.title;
    const description = cleanText(displayCampaign.displaySummary ||
        displayCampaign.summary ||
        displayCampaign.displayDescription ||
        displayCampaign.description);
    return {
        title,
        description,
        alternates: {
            canonical: url,
            languages: Object.fromEntries(LOCALES.map((locale) => [
                locale,
                `${siteUrl}/${locale}/campaigns/${campaign.slug}`,
            ])),
        },
        openGraph: {
            type: "article",
            url,
            siteName: "Destekol",
            title,
            description,
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },
    };
}
export default async function CampaignDetailPage({ params, }: {
    params: {
        slug: string;
        locale: string;
    };
}) {
    const { slug, locale } = params;
    const isDestekol = true;
    const siteUrl = getRequestSite().url;
    const [rawCampaign, dict] = await Promise.all([
        getCampaignDetails(slug, locale),
        loadTranslations(locale),
    ]);
    if (!rawCampaign) {
        notFound();
    }
    const campaign = normalizeDestekolBrandCopy(rawCampaign, locale);
    const title = campaign.displayTitle || campaign.title;
    const summary = cleanText(campaign.displaySummary || campaign.summary);
    const description = cleanText(campaign.displaySummary || campaign.summary || campaign.displayDescription || campaign.description);
    const raised = Number(campaign.raisedAmount) || 0;
    const goal = Number(campaign.goalAmount) || 0;
    const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
    const cat = categoryMeta(campaign.category, locale);
    const p = locale === "ar" ? "" : `/${locale}`;
    const t = (key: string, fallback: string) => dict[key] || fallback;
    const isEn = locale === "en";
    const isTr = locale === "tr";
    const isFr = locale === "fr";
    // 🌟 الربط الديناميكي مع بيانات قاعدة البيانات والحقول الجديدة من الأدمن
    const authorName = campaign.displayAuthorName || campaign.authorName || "";
    const authorRole = campaign.displayAuthorRole || campaign.authorRole || "";
    const txtReviewedBy = isEn
        ? "Reviewed & Verified by:"
        : isTr
            ? "Doğrulayan & İnceleyen:"
            : isFr
                ? "Vérifié et révisé par:"
                : "مُراجع ومُوثّق بواسطة:";
    const txtPublishedAt = isEn
        ? "Published:"
        : isTr
            ? "Yayınlanma:"
            : isFr
                ? "Publié:"
                : "تاريخ النشر:";
    const txtUpdatedAt = isEn
        ? "Last Updated:"
        : isTr
            ? "Son Güncelleme:"
            : isFr
                ? "Dernière mise à jour:"
                : "آخر تحديث:";
    const txtAbout = isEn
        ? "About the Campaign"
        : isTr
            ? "Kampanya Hakkında"
            : isFr
                ? "À propos de la campagne"
                : t("campaigns.about", "عن الحملة");
    const txtWidgetTitle = isEn
        ? "Make a Difference Today"
        : isTr
            ? "Hayat Değiştirmeye Katkıda Bulunun"
            : isFr
                ? "Faites une différence aujourd'hui"
                : t("donate.widget_title", "ساهم في تغيير الحياة");
    const txtDirectImpact = isEn
        ? "Direct humanitarian impact"
        : isTr
            ? "Doğrudan insani etki"
            : isFr
                ? "Impact humanitaire direct"
                : t("donate.direct", "أثر إنساني مباشر");
    const txtSecure = isEn
        ? "Secure and encrypted donation process"
        : isTr
            ? "Güvenli ve şifrelenmiş bağış süreci"
            : isFr
                ? "Processus de don sécurisé et crypté"
                : t("donate.secure", "عملية تبرع آمنة ومشفرة");
    const categoryLabels: Record<string, Record<string, string>> = {
        medical: { ar: "طبي", en: "Medical", tr: "Tıbbi", fr: "Médical" },
        food: { ar: "غذاء", en: "Food", tr: "Gıda", fr: "Nourriture" },
        shelter: { ar: "مأوى", en: "Shelter", tr: "Barınak", fr: "Abri" },
        water: { ar: "مياه", en: "Water", tr: "Su", fr: "Eau" },
        education: { ar: "تعليم", en: "Education", tr: "Eğitim", fr: "Éducation" },
        general: { ar: "عام", en: "General", tr: "Genel", fr: "Général" },
    };
    const categoryLabel = categoryLabels[campaign.category]?.[locale] || cat.label;
    const pageUrl = `${siteUrl}/${locale}/campaigns/${campaign.slug}`;
    // 🌟 معالجة التواريخ الديناميكية لـ ISO Schema و وسوم <time>
    const rawPublishedDate = campaign.publishedAt || campaign.createdAt;
    const publishedDateISO = rawPublishedDate
        ? new Date(rawPublishedDate).toISOString()
        : "2026-01-01T00:00:00.000Z";
    const updatedDateISO = campaign.updatedAt
        ? new Date(campaign.updatedAt).toISOString()
        : publishedDateISO;
    /*
     * 🌟 Dynamic Article & WebPage Schema
     */
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${pageUrl}/#article`,
        headline: title,
        description: summary || description || title,
        image: [campaign.coverImage || `${siteUrl}/brand/${"destekol-logo.png"}`],
        datePublished: publishedDateISO,
        dateModified: updatedDateISO,
        mainEntityOfPage: pageUrl,
        inLanguage: locale,
        author: {
            "@type": "Organization",
            name: authorName,
            url: `${siteUrl}/${locale}/about`,
        },
        publisher: {
            "@type": "NGO",
            name: ((await getCmsBranding(locale)).siteName || ""),
            url: siteUrl,
            logo: {
                "@type": "ImageObject",
                url: `${siteUrl}/brand/${"destekol-logo.png"}`,
            },
        },
    };
    const webPageSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${pageUrl}/#webpage`,
        url: pageUrl,
        name: title,
        description: summary || description || title,
        inLanguage: locale,
        datePublished: publishedDateISO,
        dateModified: updatedDateISO,
        isPartOf: {
            "@id": `${siteUrl}/#website`,
        },
        about: {
            "@id": `${siteUrl}/#organization`,
        },
        publisher: {
            "@id": `${siteUrl}/#organization`,
        },
        breadcrumb: {
            "@id": `${pageUrl}/#breadcrumb`,
        },
        potentialAction: {
            "@type": "DonateAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${pageUrl}#donate`,
            },
        },
    };
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}/#breadcrumb`,
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: t("nav.home", "الرئيسية"),
                item: `${siteUrl}/${locale}`,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: t("nav.campaigns", "الحملات"),
                item: `${siteUrl}/${locale}/campaigns`,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: title,
                item: pageUrl,
            },
        ],
    };
    const safeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
    return (<div className="min-h-screen border-t border-slate-100 bg-slate-50/50 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleSchema) }}/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(webPageSchema) }}/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}/>

      {<DestekolPageIntro locale={locale} title={title} description={description || summary}/>}

      <div className="mx-auto max-w-screen-xl px-6 pt-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href={`${p}/`} className="transition hover:text-brand">
            {t("nav.home", "الرئيسية")}
          </Link>
          <span>/</span>
          <Link href={`${p}/campaigns`} className="transition hover:text-brand">
            {t("nav.campaigns", "الحملات")}
          </Link>
          <span>/</span>
          <span className="max-w-xs truncate text-slate-700">{title}</span>
        </nav>

        {/* Hero Banner */}
        {campaign.coverImage && (<div className="relative mb-10 h-72 w-full overflow-hidden rounded-3xl border border-slate-100 bg-slate-100 shadow-xl sm:h-[450px]">
            <Image src={campaign.coverImage} alt={title} fill sizes="(max-width: 768px) 100vw, 1200px" className="object-cover" priority/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>
            <span className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md">
              <Icon name={cat.icon} size={14}/>
              {categoryLabel}
            </span>
          </div>)}

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Main Column */}
          <div className="space-y-10 lg:col-span-8">
            <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              {false}

              {/* 🌟 Dynamic E-E-A-T Block */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">
                    <Icon name="shield-check" size={18}/>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {txtReviewedBy}{" "}
                      <span className="text-brand">{authorName}</span>
                    </p>
                    <p className="text-xs text-slate-500">{authorRole}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                  <span>
                    {txtPublishedAt}{" "}
                    <time dateTime={publishedDateISO}>
                      {new Date(publishedDateISO).toLocaleDateString(locale, { timeZone: "UTC" })}
                    </time>
                  </span>
                  <span>
                    {txtUpdatedAt}{" "}
                    <time dateTime={updatedDateISO}>
                      {new Date(updatedDateISO).toLocaleDateString(locale, { timeZone: "UTC" })}
                    </time>
                  </span>
                </div>
              </div>

              {/* Direct Answer Block */}
              <section aria-label="Campaign summary" className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-xs text-slate-700 sm:text-sm">
                <p>
                  <strong>{(locale === "ar" ? "الجمعية" : locale === "fr" ? "Association" : locale === "tr" ? "Dernek" : "Association")}:</strong>{" "}
                  {((await getCmsBranding(locale)).siteName || "")}
                </p>
                <p>
                  <strong>{t("campaigns.category_label", "التصنيف")}:</strong>{" "}
                  {categoryLabel}
                </p>
                {goal > 0 && (<p>
                    <strong>{t("campaigns.target_goal", "الهدف المالي")}:</strong>{" "}
                    {formatCurrency(goal, "USD", locale)}
                    {" | "}
                    <strong>{t("campaigns.raised_so_far", "المجمع حتى الآن")}:</strong>{" "}
                    {formatCurrency(raised, "USD", locale)} ({new Intl.NumberFormat(locale, { style: "percent" }).format(pct / 100)})
                  </p>)}
                {summary && (<p className="mt-2 border-t border-slate-200/50 pt-3 text-slate-600">
                    {summary}
                  </p>)}
              </section>

              {/* Progress */}
              {goal > 0 && (<div className="space-y-3 pt-2">
                  <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-3.5 rounded-full bg-brand shadow-sm transition-all duration-1000" style={{ width: `${pct}%` }}/>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <div>
                      <span className="font-display text-2xl font-black text-slate-900 sm:text-3xl">
                        {formatCurrency(raised, "USD", locale)}
                      </span>
                      <span className="ms-2 text-xs text-slate-500 sm:text-sm">
                        {t("campaigns.of_goal", "من الهدف")}{" "}
                        {formatCurrency(goal, "USD", locale)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="rounded-xl bg-brand/10 px-3 py-1 text-xs font-extrabold text-brand sm:text-sm">
                        {new Intl.NumberFormat(locale, { style: "percent" }).format(pct / 100)}
                      </span>
                      <span className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 sm:text-sm">
                        <Icon name="heart" size={14} className="text-brand"/>
                        {new Intl.NumberFormat(locale).format(campaign.donorCount || 0)}{" "}
                        {t("campaigns.donors", "متبرع")}
                      </span>
                    </div>
                  </div>
                </div>)}
            </div>

            {/* Description */}
            <section className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 border-b border-slate-100 pb-4 font-display text-lg font-extrabold text-slate-900 sm:text-xl">
                <Icon name="file-text" size={20} className="text-brand"/>
                {txtAbout}
              </h2>
              <div className="whitespace-pre-line pt-2 text-sm leading-relaxed text-slate-700 sm:text-base">
                {description}
              </div>
            </section>

            {/* Field Updates */}
            {campaign.updates && campaign.updates.length > 0 && (<section className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="flex items-center gap-2 border-b border-slate-100 pb-4 font-display text-lg font-extrabold text-slate-900 sm:text-xl">
                  <Icon name="layers" size={20} className="text-brand"/>
                  {dict["campaigns.updates"] ||
                (isEn
                    ? "Field Updates"
                    : isTr
                        ? "Saha Güncellemeleri"
                        : isFr
                            ? "Mises à jour du terrain"
                            : "تحديثات الميدان")}
                </h2>

                <div className="space-y-4">
                  {campaign.updates.map((u: any) => (<article key={u.id} className="relative rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                          {u.title}
                        </h3>
                        <time dateTime={new Date(u.createdAt).toISOString()} className="rounded-md border border-slate-100 bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString(locale, { timeZone: "UTC" })}
                        </time>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                        {u.body}
                      </p>
                    </article>))}
                </div>
              </section>)}

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-around gap-4 rounded-3xl bg-brand p-6 text-center text-white shadow-lg">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Icon name="shield-check" size={18}/>
                <span>{txtSecure}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Icon name="hand-heart" size={18}/>
                <span>{txtDirectImpact}</span>
              </div>
            </div>
          </div>

          {/* Donation Box Side Widget */}
          <aside className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
            <div id="donate" className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
              <div className="bg-brand p-4 text-center text-white">
                <p className="text-xs font-bold uppercase tracking-widest">
                  {txtWidgetTitle}
                </p>
              </div>

              <div className="p-2">
                <CampaignCard currency={campaign.currency||"USD"} id={campaign.id} slug={campaign.slug} title={title} summary={summary} coverImage={campaign.coverImage} goalAmount={Number(campaign.goalAmount)} raisedAmount={Number(campaign.raisedAmount)} donorCount={campaign.donorCount} category={campaign.category} locale={locale} dict={dict}/>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>);
}
