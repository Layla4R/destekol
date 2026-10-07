import { getDonationOptions } from "@/lib/services/donation-options.service";
// app/[locale]/campaigns/page.tsx
import CampaignCard from "@/components/blocks/CampaignCard";
import DestekolPageIntro from "@/components/site/DestekolPageIntro";
import { normalizeDestekolBrandCopy } from "@/lib/destekol-brand-copy";
import { loadTranslations } from "@/lib/i18n";
import { getPageBySlug } from "@/lib/pageData";
import { getActiveCampaigns } from "@/lib/services/campaign.service";
import type { Metadata } from "next";
import Link from 'next/link';
// 🌟 تحسين الأداء: تحديث الصفحة في الكاش كل 60 ثانية بدلاً من (0)
// هذا سيجعل الصفحة تفتح في أجزاء من الثانية للزوار ويخفف الضغط عن قاعدة البيانات
export const revalidate = 60;
export async function generateMetadata({ params: { locale } }: {
    params: {
        locale: string;
    };
}): Promise<Metadata> {
    const dict = await loadTranslations(locale);
    const isDestekol = true;
    const rawTitle = dict["campaigns.page_title"] || (locale === "ar" ? "الحملات النشطة" : locale === "fr" ? "Campagnes Actives" : locale === "tr" ? "Aktif Kampanyalar" : "Active Campaigns");
    const rawDescription = dict["campaigns.page_desc"] || dict["campaigns.subtitle"] || "";
    const { title, description } = normalizeDestekolBrandCopy({ title: rawTitle, description: rawDescription }, locale);
    return { title, description, openGraph: { title, description } };
}
export default async function CampaignsPage({ params: { locale }, searchParams }: {
    params: {
        locale: string;
    };
    searchParams?: { page?: string };
}) {
    // 🌟 جلب البيانات المتوازية (Parallel Data Fetching) بدون كود قواعد بيانات
    const [campaigns, dict, page, options] = await Promise.all([
        getActiveCampaigns(locale),
        loadTranslations(locale),
        getPageBySlug("campaigns", locale),
        getDonationOptions(locale),
    ]);
    const isDestekol = true;
    const rawTitle = page?.title || dict["campaigns.title"] || "الحملات النشطة";
    const rawDescription = page?.description || dict["campaigns.subtitle"] || "ادعم حملاتنا الإنسانية واصنع الفرق";
    const { title, description, displayCampaigns } = normalizeDestekolBrandCopy({ title: rawTitle, description: rawDescription, displayCampaigns: campaigns }, locale);
    const pageSize = 8;
    const pageCount = Math.max(1, Math.ceil(displayCampaigns.length / pageSize));
    const requestedPage = Number(searchParams?.page || 1);
    const currentPage = Math.min(pageCount, Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
    const visibleCampaigns = displayCampaigns.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const paginationCopy = ({ ar: ['صفحات الحملات', 'السابق', 'التالي', 'الصفحة'], en: ['Campaign pages', 'Previous', 'Next', 'Page'], fr: ['Pages des campagnes', 'Précédent', 'Suivant', 'Page'], tr: ['Kampanya sayfaları', 'Önceki', 'Sonraki', 'Sayfa'] } as Record<string,string[]>)[locale] || ['Campaign pages', 'Previous', 'Next', 'Page'];
    const pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1).filter(n => n === 1 || n === pageCount || Math.abs(n - currentPage) <= 2);
    const pageUrl = (n: number) => `/${locale}/campaigns?page=${n}`;
    const navClass = 'flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-line px-3 py-2 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand/5';
    return (<div>
      {<DestekolPageIntro locale={locale} title={title} description={description}/>}

      {/* 🌟 Content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {displayCampaigns.length === 0 ? (<p className="text-center text-muted py-20">
            {dict["campaigns.no_campaigns"] || "لا توجد حملات نشطة حالياً."}
          </p>) : (<>
          <div className="campaigns-page-grid grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch">
            {visibleCampaigns.map((c: any) => (<CampaignCard variant="destekol" key={c.id} {...c} locale={locale} dict={dict} amounts={options.amounts}/>))}
          </div>
          <nav dir={locale === 'ar' ? 'rtl' : 'ltr'} aria-label={paginationCopy[0]} className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {currentPage > 1 ? <Link href={pageUrl(currentPage - 1)} className={navClass}>{paginationCopy[1]}</Link> : <span aria-disabled="true" className={`${navClass} opacity-40`}>{paginationCopy[1]}</span>}
            {pageNumbers.map((n, i) => <span key={n} className="flex items-center gap-2">{i > 0 && n > pageNumbers[i - 1] + 1 && <span className="px-1 text-muted" aria-hidden="true">…</span>}<Link href={pageUrl(n)} aria-label={`${paginationCopy[3]} ${n}`} aria-current={n === currentPage ? 'page' : undefined} className={`${navClass} ${n === currentPage ? '!border-brand !bg-brand !text-white' : ''}`}>{n}</Link></span>)}
            {currentPage < pageCount ? <Link href={pageUrl(currentPage + 1)} className={navClass}>{paginationCopy[2]}</Link> : <span aria-disabled="true" className={`${navClass} opacity-40`}>{paginationCopy[2]}</span>}
          </nav>
          </>)}
      </div>
    </div>);
}
