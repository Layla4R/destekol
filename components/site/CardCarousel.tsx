"use client";
import Link from "next/link";
import { Children,useEffect,useRef,useState,type ReactNode,type Ref } from "react";
const labels: Record<string, string[]> = {
    ar: ["استعرض الكل", "السابق", "التالي"],
    en: ["View all", "Previous", "Next"],
    tr: ["Tümünü gör", "Önceki", "Sonraki"],
    fr: ["Tout voir", "Précédent", "Suivant"],
};
export default function CardCarousel({ children, locale, href, enabled = true, className = "", fallbackRef }: {
    children: ReactNode;
    locale: string;
    href: string;
    enabled?: boolean;
    className?: string;
    fallbackRef?: Ref<HTMLDivElement>;
}) {
    const track = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ start: true, end: true });
    const [all, previous, next] = labels[locale] || labels.en;
    const rtl = locale === "ar";
    useEffect(() => {
        const el = track.current;
        if (!enabled || !el)
            return;
        const update = () => {
            const offset = Math.abs(el.scrollLeft);
            setEdges({ start: offset < 2, end: offset + el.clientWidth >= el.scrollWidth - 2 });
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        el.addEventListener("scroll", update, { passive: true });
        return () => { observer.disconnect(); el.removeEventListener("scroll", update); };
    }, [enabled, children]);
    if (!enabled)
        return <div ref={fallbackRef} className={className}>{children}</div>;
    const move = (direction: number) => {
        const el = track.current;
        if (!el)
            return;
        const card = el.firstElementChild as HTMLElement | null;
        const distance = (card?.offsetWidth || el.clientWidth) + 20;
        el.scrollBy({ left: direction * (rtl ? -1 : 1) * distance,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    };
    return <div className="home-card-carousel" dir={rtl ? "rtl" : "ltr"}>
    <div className="home-carousel-toolbar">
      <Link href={href} className="home-view-all">{all}<span aria-hidden="true">{rtl ? "←" : "→"}</span></Link>
      <div className="flex gap-2">
        <button type="button" aria-label={previous} disabled={edges.start} onClick={() => move(-1)}>{rtl ? "→" : "←"}</button>
        <button type="button" aria-label={next} disabled={edges.end} onClick={() => move(1)}>{rtl ? "←" : "→"}</button>
      </div>
    </div>
    <div ref={track} className="home-carousel-track" tabIndex={0}>
      {Children.toArray(children).map((child, index) => <div className="home-carousel-slide" key={(child as any)?.key ?? index}>{child}</div>)}
    </div>
  </div>;
}
