"use client";
import { useState } from "react";
export default function CardDescription({ text, locale }: {
    text: string;
    locale: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const copy: Record<string, string[]> = {
        ar: ["اقرأ المزيد", "عرض أقل"], en: ["Read more", "Show less"],
        tr: ["Devamını oku", "Daha az göster"], fr: ["Lire la suite", "Réduire"],
    };
    const labels = copy[locale] || copy.en;
    return <div className="card-description text-slate-600 text-sm leading-relaxed">
    <p className={expanded ? "" : "line-clamp-3"}>{text}</p>
    {text && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="mt-2 text-brand text-xs font-bold underline underline-offset-4">{labels[expanded ? 1 : 0]}</button>}
  </div>;
}
