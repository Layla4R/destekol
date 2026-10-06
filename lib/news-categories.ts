export interface NewsCategory {
    slug: string;
    labels: Record<string, string>;
    sortOrder: number;
}
export function newsCategoryLabel(category: NewsCategory, locale: string) {
    return category.labels[locale] || category.labels.en || category.labels.ar || category.slug;
}
export const NEWS_PAGE_SIZE = 10;
export function newsPagination(rawPage: string | undefined, count: number) {
    const parsed = rawPage && /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
    const pages = Math.max(1, Math.ceil(count / NEWS_PAGE_SIZE));
    const page = Math.min(pages, Math.max(1, Number.isSafeInteger(parsed) ? parsed : 1));
    const from = (page - 1) * NEWS_PAGE_SIZE;
    return { page, pages, from, to: from + NEWS_PAGE_SIZE - 1 };
}
export function newsListingHref(locale: string, category = "", page = 1) {
    const query = new URLSearchParams();
    if (category)
        query.set("category", category);
    if (page > 1)
        query.set("page", String(page));
    return `/${locale}/news${query.size ? `?${query}` : ""}#news-list`;
}
