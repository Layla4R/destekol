"use client";
import { addKindnessChoices } from "@/lib/kindness-cart";
import { ArrowRight,BookOpen,Droplet,Heart,Minus,Plus,Utensils } from "lucide-react";
import Link from "next/link";
import { useRef,useState } from "react";
const icons = { food: Utensils, education: BookOpen, water: Droplet, medical: Heart };
const labels: Record<string, string[]> = {
    tr: ["İyilik kutunuzu oluşturun.", "Dilediğiniz alanlarda bağış yaparak kendi iyilik kutunuzu oluşturun.", "Hemen Başla", "Sepete Ekle", "Sepeti Gör", "Sepetinize eklendi.", "Lütfen en az bir destek seçin.", "Sepet güncellenemedi. Lütfen tekrar deneyin.", "Toplam", "Bu bölüm için henüz aktif kampanya seçilmedi."],
    ar: ["اصنع صندوق الخير الخاص بك.", "اختر مجالات العطاء وساهم في الحملات التي تهمك.", "ابدأ الآن", "أضف إلى السلة", "عرض السلة", "تمت الإضافة إلى السلة.", "اختر مساهمة واحدة على الأقل.", "تعذّر تحديث السلة، حاول مجدداً.", "الإجمالي", "لم تُحدّد حملات نشطة لهذا القسم بعد."],
    en: ["Build your kindness box.", "Choose the causes you care about and create your own box of kindness.", "Start now", "Add to cart", "View cart", "Added to your cart.", "Choose at least one contribution.", "Could not update your cart. Please try again.", "Total", "No active campaigns have been selected yet."],
    fr: ["Composez votre boîte solidaire.", "Choisissez les causes qui vous tiennent à cœur.", "Commencer", "Ajouter au panier", "Voir le panier", "Ajouté au panier.", "Choisissez au moins un don.", "Impossible de modifier le panier.", "Total", "Aucune campagne active sélectionnée."],
};
export interface KindnessRow {
    campaignId: string;
    slug: string;
    title: string;
    label: string;
    icon: string;
    unitAmount: number;
}
export default function KindnessBox({ data, rows, locale, currency = "USD", buttonHref }: {
    data: any;
    rows: KindnessRow[];
    locale: string;
    currency?: string;
    buttonHref?: string;
}) {
    const t = labels[locale] || labels.en;
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [status, setStatus] = useState("");
    const [added, setAdded] = useState(false);
    const firstControl = useRef<HTMLButtonElement>(null);
    const money = (value: number) => locale === "ar" && currency === "USD"
        ? `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: Number.isInteger(value) ? 0 : 2 }).format(value)}`
        : new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
    const total = rows.reduce((sum, row) => sum + row.unitAmount * (quantities[row.campaignId] || 0), 0);
    const change = (id: string, delta: number) => { setQuantities(q => ({ ...q, [id]: Math.max(0, Math.min(99, (q[id] || 0) + delta)) })); setAdded(false); setStatus(""); };
    function add() {
        if (total <= 0) {
            setStatus(t[6]);
            return;
        }
        try {
            const cart = JSON.parse(sessionStorage.getItem("destekol_cart") || "[]");
            if (!Array.isArray(cart))
                throw new Error("Invalid cart");
            const next = addKindnessChoices(cart, rows.map(row => ({ ...row, quantity: quantities[row.campaignId] || 0 })));
            sessionStorage.setItem("destekol_cart", JSON.stringify(next));
            window.dispatchEvent(new Event("storage"));
            setQuantities({});
            setStatus(t[5]);
            setAdded(true);
        }
        catch {
            setStatus(t[7]);
        }
    }
    return <section className="kindness-box" aria-labelledby="kindness-heading" dir={locale === "ar" ? "rtl" : "ltr"}>
    <svg className="kindness-wave kindness-wave-top" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true"><path fill="#fff" d="M0 0H1440V42C1210 0 1190 105 880 55S490 105 265 46 120 16 0 38Z"/></svg>
    <div className="kindness-inner">
      <div className="kindness-art">{data.image && <img src={data.image} alt={data.imageAlt || ""} loading="lazy"/>}</div>
      <div className="kindness-copy"><h2 id="kindness-heading">{data.title || t[0]}</h2><p>{data.subtitle || t[1]}</p>{buttonHref ? <Link href={buttonHref} className="kindness-start">{data.buttonText || t[2]}<ArrowRight size={17}/></Link> : <button type="button" className="kindness-start" onClick={() => { firstControl.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" }); firstControl.current?.focus({ preventScroll: true }); }}>{data.buttonText || t[2]}<ArrowRight size={17}/></button>}</div>
      <form className="kindness-form" onSubmit={e => { e.preventDefault(); add(); }}>
        {rows.map((row, index) => {
            const Glyph = icons[row.icon as keyof typeof icons] || Heart;
            const quantity = quantities[row.campaignId] || 0;
            return <div className="kindness-row" key={row.campaignId}><Glyph size={21}/><div className="kindness-label"><Link href={`/${locale}/campaigns/${row.slug}`}>{row.label || row.title}</Link><small>{money(row.unitAmount)} / {locale === "ar" ? "مساهمة" : locale === "tr" ? "destek" : locale === "en" ? "contribution" : "don"}</small></div><div className="kindness-counter"><button type="button" disabled={quantity === 0} aria-label={`${row.label}: −`} onClick={() => change(row.campaignId, -1)}><Minus size={13}/></button><output aria-label={row.label}>{quantity}</output><button ref={index === 0 ? firstControl : undefined} type="button" disabled={quantity === 99} aria-label={`${row.label}: +`} onClick={() => change(row.campaignId, 1)}><Plus size={13}/></button></div></div>;
        })}
        {!rows.length && <p>{t[9]}</p>}
        {total > 0 && <div className="kindness-total"><span>{t[8]}</span><strong>{money(total)}</strong></div>}
        <button type="submit" className="kindness-submit" disabled={!rows.length}>{data.cartButtonText || t[3]}<ArrowRight size={17}/></button>
        <p role="status" className="kindness-status">{status}{added && <> <Link href={`/${locale}/cart`}>{t[4]} →</Link></>}</p>
      </form>
    </div>
    <svg className="kindness-wave kindness-wave-bottom" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true"><path fill="#098494" opacity=".12" d="M0 10C170 85 340 0 540 40S900 90 1100 30s230 25 340 35V100H0Z"/><path fill="#fff" d="M0 60C150 10 320 110 550 63s250 25 450 4 270-50 440 16V100H0Z"/></svg>
  </section>;
}
