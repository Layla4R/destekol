"use client";
import Icon from "@/components/icons";
import Image from "next/image";
import Link from "next/link";
import { useEffect,useMemo,useState } from "react";
type ProjectItem = {
    title?: string;
    category?: string;
    location?: string;
    status?: string;
    image?: string;
    description?: string;
    body?: string;
    icon?: string;
    buttonText?: string;
    buttonLink?: string;
};
const paginationCopy: Record<string, {
    previous: string;
    next: string;
    page: string;
}> = {
    ar: { previous: "السابق", next: "التالي", page: "صفحة" },
    en: { previous: "Previous", next: "Next", page: "Page" },
    fr: { previous: "Précédent", next: "Suivant", page: "Page" },
    tr: { previous: "Önceki", next: "Sonraki", page: "Sayfa" },
};
function getProjectIcon(item: ProjectItem): string {
    if (item.icon)
        return item.icon;
    const text = `${item.category || ""} ${item.title || ""}`.toLowerCase();
    if (/water|wash|ماء|مياه|مائي/.test(text))
        return "droplet";
    if (/health|medical|clinic|صحة|طبي|طبية|المرضى/.test(text))
        return "heart-pulse";
    if (/food|bakery|meal|غذاء|غذائي|وجبات|مخبز/.test(text))
        return "utensils";
    if (/education|school|تعليم|مدرس/.test(text))
        return "book-open";
    if (/shelter|housing|مأوى|إيواء/.test(text))
        return "home";
    return "hand-heart";
}
function getIconTone(icon: string) {
    if (icon === "droplet")
        return "bg-sky-100 text-sky-600";
    if (icon === "heart-pulse" || icon === "heart")
        return "bg-rose-100 text-rose-600";
    if (icon === "utensils")
        return "bg-amber-100 text-amber-600";
    if (icon === "book-open")
        return "bg-blue-100 text-blue-700";
    return "bg-teal-100 text-teal-600";
}
function localizeHref(href: string, locale: string) {
    if (/^(?:mailto:|tel:|#)/i.test(href))
        return href;
    let path = href;
    if (/^(?:https?:)?\/\//i.test(href)) {
        const url = new URL(href, "https://destekol.org");
        if (!["destekol.org", "www.destekol.org"].includes(url.hostname))
            return href;
        path = `${url.pathname}${url.search}${url.hash}`;
    }
    path = path.startsWith("/") ? path : `/${path}`;
    // Every language needs an explicit prefix: unprefixed Destekol URLs use Turkish.
    path = path.replace(/^\/(?:ar|en|fr|tr)(?=\/|\?|#|$)/, "");
    return `/${locale}${path === "/" ? "" : path}`;
}
export default function DestekolProjectsSection({ data, locale }: {
    data: Record<string, any>;
    locale: string;
}) {
    const items = useMemo(() => (Array.isArray(data.items) ? data.items.filter((item: ProjectItem) => item && (item.title || item.image)) : []) as ProjectItem[], [data.items]);
    const pageSize = Math.max(1, Math.floor(Number(data.pageSize) || 8));
    const pageCount = Math.ceil(items.length / pageSize);
    const [currentPage, setCurrentPage] = useState(1);
    const isRtl = locale === "ar";
    const copy = paginationCopy[locale] || paginationCopy.en;
    useEffect(() => {
        if (currentPage > pageCount)
            setCurrentPage(Math.max(1, pageCount));
    }, [currentPage, pageCount]);
    if (items.length === 0)
        return null;
    const startIndex = (currentPage - 1) * pageSize;
    const visibleItems = items.slice(startIndex, startIndex + pageSize);
    return (<section className="relative overflow-hidden bg-white px-4 py-12 sm:px-6 sm:py-16 lg:py-20" dir={isRtl ? "rtl" : "ltr"}>
      <div className="pointer-events-none absolute -left-20 top-24 h-52 w-52 rounded-full bg-teal-50/80 blur-3xl" aria-hidden="true"/>
      <div className="pointer-events-none absolute -right-20 bottom-24 h-52 w-52 rounded-full bg-sky-50/80 blur-3xl" aria-hidden="true"/>

      <div className="relative mx-auto max-w-screen-xl">
        {(data.eyebrow || data.title || data.subtitle) && (<header className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
            {data.eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#098494]">{data.eyebrow}</p>}
            {data.title && <h2 className="font-display text-2xl font-extrabold leading-tight text-[#063962] sm:text-3xl lg:text-4xl">{data.title}</h2>}
            {data.subtitle && <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{data.subtitle}</p>}
          </header>)}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {visibleItems.map((item, index) => {
            const icon = getProjectIcon(item);
            const href = item.buttonLink?.trim() ? localizeHref(item.buttonLink.trim(), locale) : null;
            const isExternal = href ? /^(?:https?:|mailto:|tel:)/i.test(href) : false;
            const cardKey = `${startIndex + index}-${item.title || "project"}`;
            return (<article key={cardKey} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e3eef2] bg-white shadow-[0_6px_22px_rgba(10,81,113,0.055)] transition duration-300 hover:-translate-y-1 hover:border-[#b9dce3] hover:shadow-[0_14px_32px_rgba(10,81,113,0.12)]">
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#e5f3f5] to-[#f5fafb]">
                  {item.image && (<Image src={item.image} alt={item.title || ""} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105"/>)}
                  {item.category && <span className="absolute end-3 top-3 max-w-[80%] truncate rounded-full bg-[#063962]/90 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm sm:text-xs">{item.category}</span>}
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-4">
                  <div className="flex min-h-[52px] items-start gap-3">
                    <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${getIconTone(icon)}`} aria-hidden="true">
                      <Icon name={icon} size={18} strokeWidth={2.2}/>
                    </span>
                    <h3 className="line-clamp-2 flex-1 text-[15px] font-extrabold leading-6 text-[#063962] sm:text-base">{item.title}</h3>
                  </div>

                  {(item.location || item.status) && (<div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-[#5b7890]">
                      {item.location && <span className="inline-flex items-center gap-1"><Icon name="map-pin" size={13} className="text-[#098494]"/>{item.location}</span>}
                      {item.status && <span className="rounded-full bg-[#f0f7f8] px-2 py-0.5 text-[#0a6e7b]">{item.status}</span>}
                    </div>)}

                  {(item.description || item.body) && <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-xs leading-6 text-slate-600">{item.description || item.body}</p>}

                  {href && (isExternal ? (<a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#d9e7ed] bg-white px-3 py-2 text-center text-[11px] font-bold text-[#063962] transition hover:border-[#0a5171] hover:bg-[#0a5171] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#098494] focus-visible:ring-offset-2">
                      {item.buttonText || (isRtl ? "استعرض تفاصيل المشروع" : locale === "tr" ? "Proje detaylarını görüntüle" : locale === "fr" ? "Voir les détails du projet" : "View project details")}
                      <Icon name={isRtl ? "arrow-left" : "arrow-right"} size={14}/>
                    </a>) : (<Link href={href} className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#d9e7ed] bg-white px-3 py-2 text-center text-[11px] font-bold text-[#063962] transition hover:border-[#0a5171] hover:bg-[#0a5171] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#098494] focus-visible:ring-offset-2">
                      {item.buttonText || (isRtl ? "استعرض تفاصيل المشروع" : locale === "tr" ? "Proje detaylarını görüntüle" : locale === "fr" ? "Voir les détails du projet" : "View project details")}
                      <Icon name={isRtl ? "arrow-left" : "arrow-right"} size={14}/>
                    </Link>))}
                </div>
              </article>);
        })}
        </div>

        {pageCount > 1 && (<nav className="mt-9 flex flex-wrap items-center justify-center gap-2" aria-label={isRtl ? "ترقيم صفحات المشاريع" : locale === "tr" ? "Proje sayfaları" : locale === "fr" ? "Pages des projets" : "Project pages"}>
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9e7ed] bg-white px-3 text-xs font-bold text-[#0a5171] transition hover:bg-[#eff8fa] disabled:cursor-not-allowed disabled:opacity-40">
              <Icon name={isRtl ? "arrow-right" : "arrow-left"} size={15}/>{copy.previous}
            </button>
            <div className="flex items-center gap-1.5" aria-live="polite">
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (<button key={page} type="button" onClick={() => setCurrentPage(page)} aria-current={currentPage === page ? "page" : undefined} aria-label={`${copy.page} ${page}`} className={`h-10 min-w-10 rounded-xl px-3 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#098494] focus-visible:ring-offset-2 ${currentPage === page ? "bg-[#0a5171] text-white shadow-sm" : "border border-[#d9e7ed] bg-white text-[#31556d] hover:bg-[#eff8fa]"}`}>
                  {page}
                </button>))}
            </div>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9e7ed] bg-white px-3 text-xs font-bold text-[#0a5171] transition hover:bg-[#eff8fa] disabled:cursor-not-allowed disabled:opacity-40">
              {copy.next}<Icon name={isRtl ? "arrow-left" : "arrow-right"} size={15}/>
            </button>
          </nav>)}
      </div>
    </section>);
}
