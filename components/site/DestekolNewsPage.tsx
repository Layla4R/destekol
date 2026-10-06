import Icon from "@/components/icons";
import DestekolPageIntro from "@/components/site/DestekolPageIntro";
import NewsletterSection from "@/components/site/NewsletterSection";
import { normalizeDestekolBrandCopy } from "@/lib/destekol-brand-copy";
import { loadTranslations } from "@/lib/i18n";
import { newsCategoryLabel,newsListingHref,newsPagination } from "@/lib/news-categories";
import { getNewsCategories } from "@/lib/news-categories-server";
import { getPageBySlug } from "@/lib/pageData";
import { getSupabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
export default async function DestekolNewsPage({ locale, searchParams }: {
    locale: string;
    searchParams: {
        category?: string | string[];
        page?: string | string[];
    };
}) {
    const db = getSupabase();
    const [categories, dict, pageData, home] = await Promise.all([
        getNewsCategories(), loadTranslations(locale), getPageBySlug("news", locale), getPageBySlug("home", locale),
    ]);
    const category = categories.find(c => c.slug === searchParams.category)?.slug || "";
    let countQuery = db.from("NewsPost").select("id", { count: "exact", head: true }).eq("isPublished", true);
    if (category)
        countQuery = countQuery.eq("categorySlug", category);
    const { count, error: countError } = await countQuery;
    if (countError)
        throw countError;
    const pagination = newsPagination(typeof searchParams.page === "string" ? searchParams.page : undefined, count || 0);
    let query = db.from("NewsPost")
        .select("id,slug,title,excerpt,coverImage,publishedAt,categorySlug")
        .eq("isPublished", true)
        .order("publishedAt", { ascending: false, nullsFirst: false }).order("id", { ascending: false });
    if (category)
        query = query.eq("categorySlug", category);
    const { data, error } = await query.range(pagination.from, pagination.to);
    if (error)
        throw error;
    let posts = data || [];
    if (locale !== "ar" && posts.length) {
        const { data: translations, error: translationError } = await db.from("NewsPostTranslation")
            .select("postId,title,excerpt").eq("locale", locale).in("postId", posts.map(p => p.id));
        if (translationError)
            throw translationError;
        const translated = new Map((translations || []).map(t => [t.postId, t]));
        posts = posts.map(post => ({ ...post, title: translated.get(post.id)?.title || post.title, excerpt: translated.get(post.id)?.excerpt || post.excerpt }));
    }
    posts = normalizeDestekolBrandCopy(posts, locale);
    const title = normalizeDestekolBrandCopy(pageData?.title || dict["news.title"] || "", locale);
    const description = normalizeDestekolBrandCopy(pageData?.description || dict["news.subtitle"] || dict["news.eyebrow"] || "", locale);
    const t = (ar: string, en: string, fr: string, tr: string) => locale === "ar" ? ar : locale === "tr" ? tr : locale === "fr" ? fr : en;
    const dateLocale = locale === "ar" ? "ar-EG" : locale === "tr" ? "tr-TR" : locale === "fr" ? "fr-FR" : "en-GB";
    const featured = pagination.page === 1 ? posts[0] : undefined;
    const remaining = featured ? posts.slice(1) : posts;
    const newsletter = home?.sections?.find(s => s.type === "newsletter");
    function card(post: typeof posts[number], isFeatured = false) {
        const postCategory = categories.find(c => c.slug === post.categorySlug);
        const date = post.publishedAt ? new Date(post.publishedAt) : null;
        return <article key={post.id} className={`destekol-news-card${isFeatured ? " destekol-news-card--featured" : ""}`}>
      <Link href={`/${locale}/news/${post.slug}`} className="destekol-news-card-link">
        <div className="destekol-news-card-image">
          {post.coverImage && <Image src={post.coverImage} alt="" fill sizes={isFeatured ? "(max-width: 767px) 40vw, 32vw" : "(max-width: 767px) 40vw, 33vw"} className="object-cover"/>}
          {postCategory && <span className="destekol-news-category">{newsCategoryLabel(postCategory, locale)}</span>}
        </div>
        <div className="destekol-news-card-copy" dir={locale === "ar" ? "rtl" : "ltr"}>
          {date && !Number.isNaN(date.getTime()) && <time dateTime={date.toISOString()}><Icon name="calendar" size={13}/>{date.toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" })}</time>}
          <h3>{post.title}</h3>
          <p>{post.excerpt}</p>
          <span className="destekol-news-read-more">{dict["news.read_more"]}</span>
        </div>
      </Link>
    </article>;
    }
    return <div className="destekol-news-page">
    <DestekolPageIntro locale={locale} title={title} description={description}/>
    <section id="news-list" className="destekol-news-list" aria-labelledby="news-list-title">
      <div className={`destekol-news-top${featured ? " has-featured" : ""}`}>
        <div className="destekol-news-introduction">
          {dict["news.eyebrow"] && <span className="destekol-news-eyebrow">{dict["news.eyebrow"]}</span>}
          <h2 id="news-list-title">{title}</h2>
          {description && <p>{description}</p>}
          <nav className="destekol-news-filters" aria-label={t("تصنيفات الأخبار", "News categories", "Catégories d’actualités", "Haber kategorileri")}>
            <Link href={newsListingHref(locale)} aria-current={!category ? "page" : undefined}>{t("الكل", "All", "Tout", "Tümü")}</Link>
            {categories.map(c => <Link key={c.slug} href={newsListingHref(locale, c.slug)} aria-current={category === c.slug ? "page" : undefined}>{newsCategoryLabel(c, locale)}</Link>)}
          </nav>
        </div>
        {featured && card(featured, true)}
      </div>
      {remaining.length > 0 && <div className="destekol-news-grid">{remaining.map(post => card(post))}</div>}
      {posts.length === 0 && <p className="destekol-news-empty">{dict["news.no_posts"]}</p>}
      {pagination.pages > 1 && <nav className="destekol-news-pagination" aria-label={t("صفحات الأخبار", "News pages", "Pages d’actualités", "Haber sayfaları")}>
        {pagination.page > 1 && <Link rel="prev" href={newsListingHref(locale, category, pagination.page - 1)}>{t("السابق", "Previous", "Précédent", "Önceki")}</Link>}
        {Array.from({ length: pagination.pages }, (_, i) => i + 1).filter(n => n === 1 || n === pagination.pages || Math.abs(n - pagination.page) <= 2).map((n, i, visible) => <span key={n}>
          {i > 0 && n - visible[i - 1] > 1 && <span className="destekol-news-pagination-gap">…</span>}
          <Link href={newsListingHref(locale, category, n)} aria-current={n === pagination.page ? "page" : undefined}>{n}</Link>
        </span>)}
        {pagination.page < pagination.pages && <Link rel="next" href={newsListingHref(locale, category, pagination.page + 1)}>{t("التالي", "Next", "Suivant", "Sonraki")}</Link>}
      </nav>}
    </section>
    {newsletter && <div className="destekol-news-newsletter"><Icon name="mail" size={82}/><NewsletterSection locale={locale} dict={dict} data={newsletter.props}/></div>}
  </div>;
}
