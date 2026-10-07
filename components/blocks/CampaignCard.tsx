"use client";
import PayTRMethods from "@/components/site/PayTRMethods";
import Icon from "@/components/icons";
import { categoryMeta } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
interface Props {
    id?: string;
    slug: string;
    title: string;
    summary: string;
    coverImage?: string | null;
    goalAmount: number;
    raisedAmount: number;
    donorCount: number;
    category?: string;
    country?: string | null;
    locale?: string;
    dict?: Record<string, string>;
    variant?: "default" | "destekol";
    currency?: string;
    amounts?: number[];
    defaultAmount?: number;
}
export default function CampaignCard({ id, slug, title, summary, coverImage, goalAmount, raisedAmount, donorCount, category, country, locale = "ar", dict = {}, variant = "default", currency = "USD", amounts = [], defaultAmount = 0 }: Props) {
    const [amount, setAmount] = useState(defaultAmount || amounts[0] || 0);
    const [custom, setCustom] = useState("");
    const [frequency, setFrequency] = useState<"one_time" | "monthly">("one_time");
    const [step, setStep] = useState<"widget" | "details">("widget");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [added, setAdded] = useState(false);
    const [cartUpdated, setCartUpdated] = useState(false);
    const [imgError, setImgError] = useState(false);
    const t = (key: string) => {
        const fallbacks: Record<string, string> = {
            donate_now: locale === "fr"
                ? "Faire un Don"
                : locale === "tr"
                    ? "Bağış Yap"
                    : locale === "en"
                        ? "Donate Now"
                        : "تبرع الآن",
            add_to_cart: locale === "fr"
                ? "Ajouter au Panier"
                : locale === "tr"
                    ? "Sepete Ekle"
                    : locale === "en"
                        ? "Add to Cart"
                        : "أضف إلى السلة",
            added: locale === "fr"
                ? "Ajouté ✓"
                : locale === "tr"
                    ? "Eklendi ✓"
                    : locale === "en"
                        ? "Added ✓"
                        : "أُضيف ✓",
            monthly: locale === "fr"
                ? "Mensuel"
                : locale === "tr"
                    ? "Aylık"
                    : locale === "en"
                        ? "Monthly"
                        : "شهري",
            one_time: locale === "fr"
                ? "Unique"
                : locale === "tr"
                    ? "Tek Seferlik"
                    : locale === "en"
                        ? "One-time"
                        : "مرة واحدة",
            of_goal: locale === "fr"
                ? "de l'objectif"
                : locale === "tr"
                    ? "hedefin"
                    : locale === "en"
                        ? "of goal"
                        : "من الهدف",
            full_name: locale === "fr"
                ? "Nom Complet"
                : locale === "tr"
                    ? "Ad Soyad"
                    : locale === "en"
                        ? "Full Name"
                        : "الاسم الكامل",
            email: locale === "fr"
                ? "Email"
                : locale === "tr"
                    ? "E-posta"
                    : locale === "en"
                        ? "Email"
                        : "البريد الإلكتروني",
            pay_card: locale === "fr"
                ? "Payer par Carte"
                : locale === "tr"
                    ? "Kart ile Öde"
                    : locale === "en"
                        ? "Pay with Card"
                        : "الدفع بالبطاقة",
            secure_payment: locale === "fr"
                ? "Paiement sécurisé"
                : locale === "tr"
                    ? "Güvenli ödeme"
                    : locale === "en"
                        ? "Secure payment"
                        : "دفع آمن ومشفر",
            edit: locale === "fr"
                ? "Modifier"
                : locale === "tr"
                    ? "Değiştir"
                    : locale === "en"
                        ? "Change"
                        : "تعديل",
            invalid_email: locale === "fr"
                ? "Email invalide"
                : locale === "tr"
                    ? "Geçersiz e-posta"
                    : locale === "en"
                        ? "Invalid email"
                        : "بريد إلكتروني غير صحيح",
            name_required: locale === "fr"
                ? "Nom et email requis"
                : locale === "tr"
                    ? "Ad ve e-posta gerekli"
                    : locale === "en"
                        ? "Name and email required"
                        : "الاسم والبريد مطلوبان",
        };
        return (dict[`campaigns.${key}`] ||
            fallbacks[key] ||
            key);
    };
    const safeGoal = Number(goalAmount) || 0;
    const safeRaised = Number(raisedAmount) || 0;
    const percentage = safeGoal > 0
        ? Math.round((safeRaised / safeGoal) *
            100)
        : 0;
    const pct = Math.min(100, Math.max(0, percentage));
    const cat = categoryMeta(category, locale);
    const prefix = locale === "ar" && variant !== "destekol"
        ? ""
        : `/${locale}`;
    const parsedCustom = custom !== ""
        ? Number(custom)
        : NaN;
    const finalAmount = Number.isFinite(parsedCustom) &&
        parsedCustom > 0
        ? parsedCustom
        : amount;

    function handleAddToCart() {
        if (!finalAmount ||
            finalAmount <= 0) {
            return;
        }
        try {
            const cart = JSON.parse(sessionStorage.getItem("destekol_cart") || "[]");
            const existingIndex = cart.findIndex((item: any) => item.slug === slug);
            const cartItem = {
                slug,
                title,
                amount: finalAmount,
                frequency,
                campaignId: id || null,
            };
            const isUpdate = existingIndex >= 0;
            if (isUpdate) {
                cart[existingIndex] =
                    cartItem;
            }
            else {
                cart.push(cartItem);
            }
            sessionStorage.setItem("destekol_cart", JSON.stringify(cart));
            setAdded(true);
            setCartUpdated(isUpdate);
            window.dispatchEvent(new Event("storage"));
            window.setTimeout(() => {
                setAdded(false);
                setCartUpdated(false);
            }, 2000);
        }
        catch {
            setError("Unable to update cart");
        }
    }
    const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";
    if (variant === "destekol") {
        const validAmount = Number.isFinite(finalAmount) && finalAmount >= 1 && (custom === "" || (Number.isFinite(Number(custom)) && Number(custom) >= 1));
        const labels = ({ ar: { goal: 'الهدف', raised: 'تم جمعه', remaining: 'المتبقي', donors: 'متبرع', support: 'ادعم الآن', country: 'البلد', unknown: 'غير محدد' }, en: { goal: 'Goal', raised: 'Raised', remaining: 'Remaining', donors: 'donors', support: 'Support now', country: 'Country', unknown: 'Not specified' }, fr: { goal: 'Objectif', raised: 'Collecté', remaining: 'Restant', donors: 'donateurs', support: 'Soutenir', country: 'Pays', unknown: 'Non précisé' }, tr: { goal: 'Hedef', raised: 'Toplanan', remaining: 'Kalan', donors: 'bağışçı', support: 'Şimdi Destek Ol', country: 'Ülke', unknown: 'Belirtilmedi' } } as Record<string, { goal: string; raised: string; remaining: string; donors: string; support: string; country: string; unknown: string }>)[locale] || { goal: 'Goal', raised: 'Raised', remaining: 'Remaining', donors: 'donors', support: 'Support now', country: 'Country', unknown: 'Not specified' };
        let countryLabel = country || labels.unknown;
        if (country === 'غزة' || country?.toLowerCase() === 'gaza') countryLabel = ({ ar: 'غزة', en: 'Gaza', fr: 'Gaza', tr: 'Gazze' } as Record<string,string>)[locale] || 'Gaza';
        if (country && /^[A-Za-z]{2}$/.test(country)) { try { countryLabel = new Intl.DisplayNames([locale], { type: 'region' }).of(country.toUpperCase()) || country; } catch {} }
        const donationUrl = `/${locale}/donate?${new URLSearchParams({ ...(id ? { campaign: id } : {}), amount: String(finalAmount), freq: frequency === 'monthly' ? 'MONTHLY' : 'ONE_TIME' })}`;
        const money = (value: number) => locale === "ar" && currency === "USD"
            ? `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`
            : new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
        const currencySymbol = locale === "ar" && currency === "USD"
            ? "$"
            : new Intl.NumberFormat(locale, { style: "currency", currency }).formatToParts(0).find(p => p.type === "currency")?.value;
        return <article className="destekol-campaign-card" dir={locale === "ar" ? "rtl" : "ltr"}>
      <Link href={prefix + "/campaigns/" + slug} className="dc-image" aria-label={title}>
        {coverImage && !imgError ? <Image src={coverImage} alt={title} fill sizes="(max-width: 767px) 100vw, 33vw" className="object-cover" onError={() => setImgError(true)}/> : <Icon name="hand-heart" size={42}/>}
      </Link>
      <div className="dc-body">
        <div className="dc-meta"><span><Icon name={cat.icon} size={13}/>{cat.label}</span><span title={labels.country}><Icon name="map-pin" size={13}/>{countryLabel}</span></div>
        <Link href={prefix + "/campaigns/" + slug}><h3>{title}</h3><p>{summary}</p></Link>
        <dl className="dc-funding">{[[labels.goal,safeGoal],[labels.raised,safeRaised],[labels.remaining,Math.max(0,safeGoal-safeRaised)]].map(([label,value]) => <div key={String(label)}><dt>{label}</dt><dd>{money(Number(value))}</dd></div>)}</dl>
        <div className="dc-progress" role="progressbar" aria-label={title} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><span style={{ width: pct + "%" }}/></div>
        <div className="dc-totals"><b>{pct}%</b><span><strong>{money(safeRaised)}</strong> / {money(safeGoal)}</span></div>
        <div className="dc-frequency">{(["one_time", "monthly"] as const).map(value => <button key={value} type="button" aria-pressed={frequency === value} onClick={() => setFrequency(value)}>{locale === "tr" && value === "one_time" ? "Bir Kez" : t(value)}</button>)}</div>
        <div className="dc-amounts">{amounts.map(value => <button key={value} type="button" aria-pressed={custom === "" && amount === value} onClick={() => { setAmount(value); setCustom(""); }}>{money(value)}</button>)}</div>
        <label className="dc-custom"><span>{currencySymbol}</span><input type="number" min="1" step="0.01" value={custom} onChange={e => setCustom(e.target.value)} aria-label={locale === "ar" ? "مبلغ آخر" : locale === "tr" ? "Diğer tutar" : locale === "fr" ? "Autre montant" : "Other amount"} placeholder={locale === "ar" ? "مبلغ آخر" : locale === "tr" ? "Diğer tutar" : locale === "fr" ? "Autre montant" : "Other amount"}/></label>
        <div className="dc-actions"><Link href={donationUrl} onClick={e => { if (!validAmount) e.preventDefault(); }} aria-disabled={!validAmount} className="dc-donate">{labels.support}<Icon name={locale === 'ar' ? 'arrow-left' : 'arrow-right'} size={15}/></Link><button type="button" disabled={!validAmount} onClick={handleAddToCart} className="dc-add"><Icon name={added ? 'check' : 'shopping-bag'} size={15}/>{added ? t('added') : t('add_to_cart')}</button></div>
        <div className="dc-donors"><Icon name="users" size={16}/><strong>{new Intl.NumberFormat(locale).format(Math.max(0,Number(donorCount)||0))}</strong><span>{labels.donors}</span></div>
      </div>
    </article>;
    }
    return (<div className="campaign-card group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Image */}

      <Link href={`${prefix}/campaigns/${slug}`} className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden bg-slate-100" aria-label={title}>
        {coverImage &&
            !imgError ? (<Image src={coverImage} alt={title} fill quality={60} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" onError={() => setImgError(true)}/>) : (<div className="flex h-full w-full items-center justify-center text-brand/30">
            <Icon name="hand-heart" size={48}/>
          </div>)}

        <span className="absolute right-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full bg-slate-900/75 px-3 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur-md">
          <Icon name={cat.icon} size={12}/>

          {cat.label}
        </span>
      </Link>

      {/* Content */}

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <Link href={`${prefix}/campaigns/${slug}`}>
            <h3 className="mb-2 line-clamp-1 font-display text-base font-bold text-slate-900 transition-colors group-hover:text-brand">
              {title}
            </h3>

            <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-slate-500">
              {summary}
            </p>
          </Link>

          {/* Progress */}

          <div className="mb-5 space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-brand transition-all duration-1000" style={{
            width: `${pct}%`,
        }}/>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <div>
                <span className="text-sm font-extrabold text-slate-900">
                  {formatCurrency(safeRaised, currency, locale)}
                </span>

                <span className="ms-1 text-[11px] text-slate-500">
                  {t("of_goal")}{" "}
                  {formatCurrency(safeGoal, currency, locale)}
                </span>
              </div>

              <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">
                {pct}%
              </span>
            </div>
          </div>
        </div>

        {/* Donation Widget */}

        <div className="mt-auto rounded-xl border border-slate-100 bg-slate-50/70 p-3">
          {step === "widget" ? (<div className="space-y-2.5">
              {/* Frequency */}

              <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
                <button type="button" onClick={() => setFrequency("one_time")} className={`flex-1 rounded-md py-1.5 transition-all ${frequency ===
                "one_time"
                ? "bg-brand text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"}`}>
                  {t("one_time")}
                </button>

                <button type="button" onClick={() => setFrequency("monthly")} className={`flex-1 rounded-md py-1.5 transition-all ${frequency ===
                "monthly"
                ? "bg-brand text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"}`}>
                  {t("monthly")}
                </button>
              </div>

              {/* Quick Amounts */}

              <div className="grid grid-cols-4 gap-1.5">
                {amounts.map((value) => (<button key={value} type="button" onClick={() => {
                    setAmount(value);
                    setCustom("");
                }} className={`rounded-lg border py-1.5 text-xs font-bold transition-all ${finalAmount ===
                    value &&
                    !custom
                    ? "border-brand bg-brand text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand hover:text-brand"}`}>
                      ${value}
                    </button>))}
              </div>

              {/* Custom Amount */}

              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => {
                const value = Math.max(1, finalAmount - 5);
                setAmount(value);
                setCustom(String(value));
            }} aria-label="Decrease amount" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-base font-medium text-slate-700 transition-colors hover:border-brand">
                  −
                </button>

                <div className="relative flex-1">
                  <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs font-semibold text-slate-500">
                    $
                  </span>

                  <input type="number" min={1} value={custom !== ""
                ? custom
                : String(finalAmount)} onChange={(e) => setCustom(e.target.value)} onBlur={() => {
                if (custom === "" ||
                    Number(custom) < 1) {
                    setCustom("");
                }
            }} aria-label="Custom Amount" className="block m-0 w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-6 pr-2 text-center text-xs font-semibold focus:border-brand focus:outline-none"/>
                </div>

                <button type="button" onClick={() => {
                const value = finalAmount + 5;
                setAmount(value);
                setCustom(String(value));
            }} aria-label="Increase amount" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-base font-medium text-slate-700 transition-colors hover:border-brand">
                  +
                </button>
              </div>

              {/* Actions */}

              <div className="flex gap-2 pt-0.5">
                <button type="button" onClick={handleAddToCart} className={`flex shrink-0 items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${added
                ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                : "border-slate-200 bg-white text-slate-700 hover:border-brand hover:text-brand"}`}>
                  <Icon name={added
                ? "check"
                : "layers"} size={14}/>

                  <span>
                    {added
                ? cartUpdated
                    ? "✓"
                    : t("added")
                : t("add_to_cart")}
                  </span>
                </button>

                <button type="button" onClick={() => {
                setStep("details");
                setName("");
                setEmail("");
                setError("");
            }} disabled={!finalAmount ||
                finalAmount <= 0} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-2 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50">
                  <Icon name="heart" size={14}/>

                  {t("donate_now")}
                </button>
              </div>
            </div>) : (<div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand">
                  {frequency ===
                "monthly"
                ? t("monthly")
                : t("one_time")}{" "}
                  — ${finalAmount}
                </span>

                <button type="button" onClick={() => {
                setStep("widget");
                setError("");
            }} className="text-[11px] text-slate-500 underline hover:text-slate-800">
                  {t("edit")}
                </button>
              </div>

              <input type="text" placeholder={t("full_name")} aria-label={t("full_name")} value={name} onChange={(e) => setName(e.target.value)} className={inputClass}/>

              <input type="email" placeholder={t("email")} aria-label={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass}/>

              {error && (<p className="flex items-center gap-1 text-[11px] text-red-500">
                  <Icon name="x" size={11}/>

                  {error}
                </p>)}

              <PayTRMethods locale={locale} monthly={frequency === "monthly"} onCollapse={() => { setStep("widget"); setError(""); }}/>



              <p className="flex items-center justify-center gap-1 pt-0.5 text-center text-[10px] text-slate-500">
                <Icon name="shield-check" size={10}/>

                {t("secure_payment")}
              </p>
            </div>)}
        </div>
      </div>
    </div>);
}
