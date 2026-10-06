import { getCmsBranding } from "@/lib/cms-branding";
import Icon from "@/components/icons";
import DestekolPageIntro from "@/components/site/DestekolPageIntro";
import { getDestekolOrganizationName,normalizeDestekolBrandCopy } from "@/lib/destekol-brand-copy";
import { LOCALES,loadTranslations } from "@/lib/i18n";
import { normalizePublicContact,officialEmail } from "@/lib/public-contact";
import { getRequestSite } from "@/lib/request-site";
import { getSupabase } from "@/lib/supabase";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
export const revalidate = 0;
function cleanText(value: unknown): string {
    if (typeof value !== "string")
        return "";
    return value
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function parseAdminDateToISO(dateVal: any): string {
    if (!dateVal)
        return new Date().toISOString();
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
    }
    try {
        const str = String(dateVal).trim();
        const match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
            const [, month, day, year] = match;
            return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`).toISOString();
        }
    }
    catch {
    }
    return new Date().toISOString();
}
function getYouTubeEmbedUrl(url?: string | null): string | null {
    if (!url)
        return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
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
async function getPostWithTranslation(slug: string, locale: string) {
    const supabase = getSupabase();
    const { data: post } = await supabase
        .from("NewsPost")
        .select("*")
        .eq("slug", slug)
        .eq("isPublished", true)
        .maybeSingle();
    if (!post) {
        return null;
    }
    let displayTitle = post.title;
    let displayExcerpt = post.excerpt;
    let displayBody = post.body;
    let displayBody2 = post.body2 || "";
    let displayVideoUrl = post.videoUrl || "";
    if (locale !== "ar") {
        const { data: translation } = await supabase
            .from("NewsPostTranslation")
            .select("title, excerpt, body, body2, videoUrl")
            .eq("postId", post.id)
            .eq("locale", locale)
            .maybeSingle();
        if (translation) {
            if (translation.title)
                displayTitle = translation.title;
            if (translation.excerpt)
                displayExcerpt = translation.excerpt;
            if (translation.body)
                displayBody = translation.body;
            if (translation.body2)
                displayBody2 = translation.body2;
            if (translation.videoUrl)
                displayVideoUrl = translation.videoUrl;
        }
    }
    const result = {
        ...post,
        displayTitle,
        displayExcerpt,
        displayBody,
        displayBody2,
        displayVideoUrl,
    };
    return normalizeDestekolBrandCopy(result, locale);
}
export async function generateMetadata({ params, }: {
    params: {
        slug: string;
        locale: string;
    };
}): Promise<Metadata> {
    const post = await getPostWithTranslation(params.slug, params.locale);
    if (!post)
        return {};
    const isDestekol = true;
    const siteUrl = getRequestSite().url;
    const url = `${siteUrl}/${params.locale}/news/${post.slug}`;
    const image = post.coverImage || `${siteUrl}/brand/${"destekol-logo.png"}`;
    const title = cleanText(post.displayTitle);
    const description = cleanText(post.displayExcerpt) || cleanText(post.displayBody).slice(0, 160);
    const rawPublishedDate = post.publishedAt || post.published_at || post.createdAt || post.created_at;
    const publishedDateISO = parseAdminDateToISO(rawPublishedDate);
    const rawUpdatedDate = post.updatedAt || post.updated_at;
    const updatedDateISO = rawUpdatedDate ? parseAdminDateToISO(rawUpdatedDate) : new Date().toISOString();
    return {
        title,
        description,
        alternates: {
            canonical: url,
            languages: Object.fromEntries(LOCALES.map((locale) => [locale, `${siteUrl}/${locale}/news/${post.slug}`])),
        },
        openGraph: {
            type: "article",
            url,
            siteName: "Destekol",
            title,
            description,
            publishedTime: publishedDateISO,
            modifiedTime: updatedDateISO,
            images: [{ url: image, width: 1200, height: 630, alt: title }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },
    };
}
export default async function NewsPostPage({ params, }: {
    params: {
        slug: string;
        locale: string;
    };
}) {
    const { slug, locale } = params;
    const isDestekol = true;
    const siteUrl = getRequestSite().url;
    const [post, dict] = await Promise.all([
        getPostWithTranslation(slug, locale),
        loadTranslations(locale),
    ]);
    if (!post) {
        notFound();
    }
    const displayTitle = cleanText(post.displayTitle);
    const displayExcerpt = cleanText(post.displayExcerpt);
    const displayBody = post.displayBody || "";
    const displayBody2 = post.displayBody2 || "";
    const displayVideoUrl = post.displayVideoUrl || "";
    // 🌟 استخراج وقراءة المعرض والمشاهد بمرونة قاطعة
    const gallery = parseGalleryImages(post.gallery);
    const secondaryImage = typeof post.secondaryImage === "string" && post.secondaryImage.trim() !== "" ? post.secondaryImage : null;
    const p = locale === "ar" ? "" : `/${locale}`;
    const isAr = locale === "ar";
    const isEn = locale === "en";
    const isTr = locale === "tr";
    const isFr = locale === "fr";
    const rawPublishedDate = post.publishedAt || post.published_at || post.createdAt || post.created_at;
    const publishedDateISO = parseAdminDateToISO(rawPublishedDate);
    const rawUpdatedDate = post.updatedAt || post.updated_at;
    const updatedDateISO = rawUpdatedDate ? parseAdminDateToISO(rawUpdatedDate) : new Date().toISOString();
    const youtubeEmbed = getYouTubeEmbedUrl(displayVideoUrl);
    const txtWrittenBy = isEn ? "Written & Verified by:" : isTr ? "Yazan & Doğrulayan:" : isFr ? "Rédigé et vérifié par:" : "حرره ووثّقه:";
    const txtAuthorName = post.authorName || post.author_name || "";
    const txtTrustBadge = post.authorRole || post.author_role || "";
    const txtPublishedAt = isEn ? "Published:" : isTr ? "Yayınlanma:" : isFr ? "Publié:" : "تاريخ النشر:";
    const txtUpdatedAt = isEn ? "Last Updated:" : isTr ? "Son Güncelleme:" : isFr ? "Dernière mise à jour:" : "آخر تحديث:";
    const pageUrl = `${siteUrl}/${locale}/news/${post.slug}`;
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}/#breadcrumb`,
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: isAr ? "الرئيسية" : isTr ? "Ana Sayfa" : isFr ? "Accueil" : "Home",
                item: `${siteUrl}/${locale}`,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: isAr ? "الأخبار" : isTr ? "Haberler" : isFr ? "Actualités" : "News",
                item: `${siteUrl}/${locale}/news`,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: displayTitle,
                item: pageUrl,
            },
        ],
    };
    const imagesArray = [post.coverImage, secondaryImage, ...gallery].filter(Boolean);
    const articleSchema: any = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "@id": `${pageUrl}/#article`,
        headline: displayTitle,
        description: displayExcerpt || cleanText(displayBody).slice(0, 160),
        image: imagesArray.length > 0 ? imagesArray : [`${siteUrl}/brand/${"destekol-logo.png"}`],
        datePublished: publishedDateISO,
        dateModified: updatedDateISO,
        inLanguage: locale,
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": pageUrl,
        },
        author: {
            "@type": "Organization",
            name: txtAuthorName,
            url: `${siteUrl}/${locale}/about`,
        },
        publisher: {
            "@type": "Organization",
            "@id": `${siteUrl}/#organization`,
            name: ((await getCmsBranding()).siteName || ""),
            ...({}),
            iso6523Code: "",
            url: siteUrl,
            logo: {
                "@type": "ImageObject",
                url: `${siteUrl}/brand/${"destekol-logo.png"}`,
            },
            contactPoint: {
                "@type": "ContactPoint",
                email: officialEmail(true),
                contactType: "public relations"
            }
        },
    };
    const safeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
    const renderFormattedBody = (content: string) => {
        if (!content)
            return null;
        const hasHtml = /<[a-z][\s\S]*>/i.test(content);
        if (hasHtml) {
            return (<div className="prose prose-base sm:prose-lg max-w-none text-slate-800 leading-relaxed prose-p:leading-relaxed prose-headings:font-bold" dangerouslySetInnerHTML={{ __html: normalizePublicContact(content, officialEmail(true)) }}/>);
        }
        return (<div className="space-y-4 text-slate-800 text-sm sm:text-base leading-relaxed">
        {content.split("\n").map((paragraph, idx) => paragraph.trim() ? <p key={idx} className="leading-relaxed">{paragraph}</p> : null)}
      </div>);
    };
    return (<article className="mx-auto max-w-screen-xl px-4 sm:px-6 py-6 sm:py-10 bg-white min-h-screen" itemScope itemType="http://schema.org/NewsArticle">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleSchema) }}/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}/>

      {<DestekolPageIntro locale={locale} title={displayTitle} description={displayExcerpt || cleanText(displayBody).slice(0, 180)}/>}

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href={`${p}/`} className="transition hover:text-brand">
          {dict["nav.home"] || (isAr ? "الرئيسية" : "Home")}
        </Link>
        <span>/</span>
        <Link href={`${p}/news`} className="transition hover:text-brand">
          {dict["nav.news"] || (isAr ? "الأخبار" : "News")}
        </Link>
        <span>/</span>
        <span className="max-w-xs truncate text-slate-700 font-bold">{displayTitle}</span>
      </nav>

      {/* Title Header */}
      <header className="max-w-4xl mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand mb-2">
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse"/>
          <span>{isAr ? "تقرير ميداني حصري" : "Field Coverage"}</span>
        </div>

        {/* 🌟 تعديل الخط لمنع التداخل والقطع */}
        {false}

        {/* E-E-A-T Visible Dates & Author Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">
              <Icon name="file-text" size={16}/>
            </div>
            <div>
              <p className="font-bold text-slate-900">
                {txtWrittenBy} <span className="text-brand">{txtAuthorName}</span>
              </p>
              <p className="text-[11px] text-slate-500">{txtTrustBadge}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600">
            <span>
              {txtPublishedAt}{" "}
              <time dateTime={publishedDateISO}>
                {new Date(publishedDateISO).toLocaleDateString(locale)}
              </time>
            </span>
            <span>
              {txtUpdatedAt}{" "}
              <time dateTime={updatedDateISO}>
                {new Date(updatedDateISO).toLocaleDateString(locale)}
              </time>
            </span>
          </div>
        </div>
      </header>

      {/* Cover Image (Main Banner) */}
      {post.coverImage && (<div className="relative mb-8 h-56 sm:h-[400px] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm border border-slate-100">
          <Image src={post.coverImage} alt={displayTitle} fill sizes="(max-width: 768px) 100vw, 1200px" className="object-cover" priority/>
        </div>)}

      {/* AI / GEO Direct Answer Callout Box */}
      {displayExcerpt && (<section aria-label="Executive Summary" className="mb-8 border-s-4 border-brand bg-brand/5 p-4 rounded-e-xl text-xs sm:text-sm leading-relaxed text-slate-800">
          <strong className="block mb-1 text-xs uppercase tracking-wider text-brand font-bold flex items-center gap-1.5">
            <Icon name="shield-check" size={14}/>
            {isEn ? "Executive Summary" : isTr ? "Özet Rapor" : isFr ? "Résumé Exécutif" : "ملخص التقرير الميداني"}
          </strong>
          <p className="font-medium text-slate-700 leading-relaxed">{displayExcerpt}</p>
        </section>)}

      {/* Grid Layout: Main Article vs Sticky Sidebar Video */}
      <div className={`grid grid-cols-1 ${displayVideoUrl ? "lg:grid-cols-12" : "max-w-4xl mx-auto"} gap-8 items-start`}>
        
        {/* Main Body Column */}
        <div className={`${displayVideoUrl ? "lg:col-span-8" : "w-full"} space-y-6`}>
          
          {/* 1. Primary Text Block */}
          {displayBody && (<div className="text-slate-800 text-sm sm:text-base leading-relaxed">
              {renderFormattedBody(displayBody)}
            </div>)}

          {/* 2. Secondary Inline Image */}
          {secondaryImage && (<figure className="my-6">
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-100">
                <Image src={secondaryImage} alt={displayTitle} fill sizes="(max-width: 768px) 100vw, 70vw" className="object-cover"/>
              </div>
            </figure>)}

          {/* 3. Second Text Block (Body 2) */}
          {displayBody2 && (<div className="text-slate-800 text-sm sm:text-base leading-relaxed pt-2">
              {renderFormattedBody(displayBody2)}
            </div>)}

          {/* 4. Side-by-Side Image Gallery */}
          {gallery.length > 0 && (<section className="pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
                <Icon name="image" size={16} className="text-brand"/>
                {isAr ? "مشاهد وسائط من الميدان" : isTr ? "Saha Görselleri" : isFr ? "Galerie de Photos" : "Field Photo Gallery"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gallery.map((imgUrl, idx) => (<div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm">
                    <Image src={imgUrl} alt={`Gallery media ${idx + 1}`} fill sizes="(max-width: 640px) 100vw, 40vw" className="object-cover hover:scale-105 transition-transform duration-300"/>
                  </div>))}
              </div>
            </section>)}
        </div>

        {/* 5. Sticky Video Sidebar */}
        {displayVideoUrl && (<aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="bg-slate-900 rounded-2xl p-3.5 text-white shadow-lg border border-slate-800">
              <div className="flex items-center gap-2 mb-2 px-1 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"/>
                {isAr ? "تغطية مرئية خاصة" : isTr ? "Özel Video Yayını" : isFr ? "Couverture Vidéo" : "Special Video Coverage"}
              </div>

              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800">
                {youtubeEmbed ? (<iframe src={youtubeEmbed} className="w-full h-full border-0" allowFullScreen title={displayTitle}/>) : (<video src={displayVideoUrl} controls playsInline className="w-full h-full object-cover"/>)}
              </div>

              <p className="text-[11px] text-slate-300 mt-2.5 px-1 leading-relaxed">
                {(isAr ? "تقرير توثيقي مصور يستعرض استجابة فرق Destekol الميدانية للأزمة." : "Documentary video highlighting Destekol's field response.")}
              </p>
            </div>
          </aside>)}

      </div>

      {/* Back Link Footer Strip */}
      <div className="mt-10 border-t border-slate-100 pt-6">
        <Link href={`${p}/news`} className="inline-flex items-center gap-2 font-bold text-brand hover:underline text-xs sm:text-sm">
          <Icon name="arrow-left" size={14} className={isAr ? "rotate-180" : ""}/>
          {dict["news.back"] || (isAr ? "العودة إلى قائمة الأخبار" : "Back to News List")}
        </Link>
      </div>
    </article>);
}
