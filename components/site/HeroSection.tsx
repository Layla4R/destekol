"use client";
import PayTRMethods from "@/components/site/PayTRMethods";
import { interfaceCopy } from "@/lib/interface-copy";

import { storyLink } from "@/lib/story-link";
import Icon from "@/components/icons";
import Image from "next/image";
import Link from "next/link";
import { useCallback,useEffect,useState,} from "react";
interface Slide {
    image: string;
    title_ar: string;
    title_en: string;
    title_fr: string;
    title_tr: string;
    subtitle_ar: string;
    subtitle_en: string;
    subtitle_fr: string;
    subtitle_tr: string;
    buttonLabel?: string;
    buttonUrl?: string;
}
interface Props {
    locale: string;
    dict: Record<string, string>;
    heroImage?: string | null;
    heroSlides?: Slide[] | null;
    accentColor?: string | null;
    primaryColor?: string | null;
    data?: any;
    isDestekol?: boolean;
    mode?: "full" | "hero" | "quick";
}


export default function HeroSection({ locale, dict, heroImage, heroSlides, accentColor, primaryColor, data, isDestekol: isDestekolProp, mode = "full", }: Props) {
    const isDestekol = true;
    const accent = accentColor || "#F00F5A";
    const primary = primaryColor || "#0069D2";
    /*
       * Admin slides
       */
    const adminSlides = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.slides)
            ? data.slides
            : [];
    const slides: Slide[] = adminSlides.length > 0
        ? adminSlides
            .map((slide: any) => ({
            image: slide?.backgroundImage ||
                slide?.image ||
                slide?.photo ||
                heroImage ||
                "",
            title_ar: slide?.headline ||
                slide?.title_ar ||
                slide?.title ||
                "",
            title_en: slide?.headline ||
                slide?.title_en ||
                slide?.title ||
                "",
            title_fr: slide?.headline ||
                slide?.title_fr ||
                slide?.title ||
                "",
            title_tr: slide?.headline ||
                slide?.title_tr ||
                slide?.title ||
                "",
            subtitle_ar: slide?.subheading ||
                slide?.subtitle_ar ||
                slide?.subtitle ||
                slide?.description ||
                "",
            subtitle_en: slide?.subheading ||
                slide?.subtitle_en ||
                slide?.subtitle ||
                slide?.description ||
                "",
            subtitle_fr: slide?.subheading ||
                slide?.subtitle_fr ||
                slide?.subtitle ||
                slide?.description ||
                "",
            subtitle_tr: slide?.subheading ||
                slide?.subtitle_tr ||
                slide?.subtitle ||
                slide?.description ||
                "",
            buttonLabel: slide?.buttonLabel || slide?.buttonText || "",
            buttonUrl: slide?.buttonUrl || slide?.buttonLink || "",
        }))
            .filter((slide: Slide) => slide.image)
        : heroSlides && heroSlides.length > 0 ? heroSlides : [];
    const [current, setCurrent] = useState(0);
    const [animating, setAnimating] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [amount, setAmount] = useState(Number(data?.defaultAmount ?? data?.amounts?.[0]?.value ?? data?.amounts?.[0]) || 0);
    const [custom, setCustom] = useState("");
    const [freq, setFreq] = useState<"ONE_TIME" | "MONTHLY">("ONE_TIME");
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [payError, setPayError] = useState("");
    const [cartAdded, setCartAdded] = useState(false);
    const final = custom !== ""
        ? Math.max(1, Number(custom) || 1)
        : amount;
    const t = (key: string, ar: string, en: string, fr: string, tr: string) => {
        return (dict[key] ||
            (locale === "ar"
                ? ar
                : locale === "fr"
                    ? fr
                    : locale === "tr"
                        ? tr
                        : en));
    };
    /*
     * Reset current slide if data changes.
     */
    useEffect(() => {
        setCurrent((value) => Math.min(value, Math.max(0, slides.length - 1)));
    }, [slides.length]);
    const goTo = useCallback((index: number) => {
        if (animating ||
            slides.length <= 1 ||
            index === current) {
            return;
        }
        const safeIndex = Math.max(0, Math.min(index, slides.length - 1));
        setAnimating(true);
        setTimeout(() => {
            setCurrent(safeIndex);
            setAnimating(false);
        }, 400);
    }, [animating, current, slides.length]);
    const next = useCallback(() => {
        if (slides.length <= 1)
            return;
        goTo((current + 1) %
            slides.length);
    }, [
        current,
        slides.length,
        goTo,
    ]);
    useEffect(() => {
        if (slides.length <= 1 ||
            hovered ||
            showDetails) {
            return;
        }
        const timer = window.setInterval(next, 6000);
        return () => window.clearInterval(timer);
    }, [
        next,
        slides.length,
        hovered,
        showDetails,
    ]);
    const slide = slides[current] || slides[0];
    const locKey = locale === "ar"
        ? "ar"
        : locale === "fr"
            ? "fr"
            : locale === "tr"
                ? "tr"
                : "en";

    function handleAddToCart() {
        if (!final || final <= 0)
            return;
        try {
            const cart = JSON.parse(sessionStorage.getItem("destekol_cart") ||
                "[]");
            const existingIndex = cart.findIndex((item: any) => item.slug === "__general__");
            const item = {
                slug: "__general__",
                title: t("donate.title", "تبرع عام", "General Donation", "Don Général", "Genel Bağış"),
                amount: final,
                frequency: freq === "ONE_TIME"
                    ? "one_time"
                    : "monthly",
                campaignId: null,
            };
            if (existingIndex >= 0) {
                cart[existingIndex] = item;
            }
            else {
                cart.push(item);
            }
            sessionStorage.setItem("destekol_cart", JSON.stringify(cart));
            window.dispatchEvent(new Event("storage"));
            setCartAdded(true);
            window.setTimeout(() => setCartAdded(false), 2000);
        }
        catch {
            setPayError(t("common.error", "حدث خطأ", "An error occurred", "Une erreur s'est produite", "Bir hata oluştu"));
        }
    }
    // Each slide uses the campaign URL saved by the admin.
    const enteredUrl = slide?.buttonUrl?.trim() || "";
    const donationUrl = storyLink(enteredUrl, locale) || `/${locale}/donate`;
    if (!slide) {
        return null;
    }
    const donationButtonClass = "inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-lg font-bold text-white shadow-lg transition-all enabled:hover:scale-[1.02] disabled:cursor-not-allowed";
    const donationButtonContent = <><Icon name="heart" size={20}/>{slide.buttonLabel || t("hero.cta_donate", "تبرع الآن", "Donate Now", "Faire un Don", "Bağış Yap")}</>;
    if (mode !== "quick" && !slides.length) return null;
    return (<section onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className="hero-section relative flex flex-col justify-between overflow-hidden bg-slate-900 -mt-20 pt-20">
      {mode !== "quick" && <div className="hero-stage relative w-full overflow-hidden">

  {/* يحافظ على النسبة الأصلية للصورة ويحدد ارتفاع السلايدر تلقائياً */}
  <img src={slide.image} alt="" aria-hidden="true" className="block w-full h-auto invisible pointer-events-none"/>

  {/* Background Slides */}
  {slides.map((sl, index) => (<div key={`${sl.image}-${index}`} className="absolute inset-0 transition-opacity duration-1000 ease-in-out" style={{
                    opacity: index === current && !animating
                        ? 1
                        : 0,
                    zIndex: 0,
                }}>
      <Image src={sl.image} alt={sl[`title_${locKey}` as keyof Slide] ||
                    sl.title_ar ||
                    "Hero"} fill priority={index === 0} quality={75} sizes="100vw" className="object-contain object-center"/>
    </div>))}

  {/* Decorative Effect */}
  <div className="pointer-events-none absolute top-1/4 -right-20 z-[1] h-80 w-80 rounded-full bg-white/5 blur-3xl"/>

  {/* Main Content */}
  <div className="hero-caption absolute inset-0 z-10 flex items-end py-8 lg:py-11">
    <div className="mx-auto w-full max-w-screen-xl px-6">
      <div className="max-w-2xl">

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-md">
          <span className="h-2 w-2 animate-pulse rounded-full" style={{
                backgroundColor: accent,
            }}/>

          <span className="text-xs font-medium uppercase tracking-wider text-white/90">
            {data?.eyebrow || ""}
          </span>
        </div>

        <h1 className="font-display font-extrabold text-white drop-shadow-md" style={{
                fontSize: "clamp(2.5rem, 3vw, 5.25rem)",
            }}>
          {slide[`title_${locKey}` as keyof Slide] || slide.title_ar}
        </h1>

        <p className="mb-8 max-w-2xl font-semibold leading-relaxed text-white drop-shadow-md" style={{
                fontSize: "clamp(1.125rem, 1.8vw, 1.5rem)",
            }}>
          {slide[`subtitle_${locKey}` as keyof Slide] || slide.subtitle_ar}
        </p>

        <div className="hero-actions flex flex-wrap items-center gap-4">
          {donationUrl ? (<Link href={donationUrl} className={donationButtonClass} style={{
                    backgroundColor: "var(--destekol-accent, #F00F5A)",
                }}>
              {donationButtonContent}
            </Link>) : (<button type="button" disabled className={donationButtonClass} style={{
                    backgroundColor: "var(--destekol-accent, #F00F5A)",
                }}>
              {donationButtonContent}
            </button>)}
        </div>

      </div>
    </div>
  </div>

  {data?.badgeText && <div className="destekol-hero-badge"><Icon name="heart" size={28}/><span>{data.badgeText}</span></div>}
  {/* Slider Controls */}
  {slides.length > 1 && (<div className="hero-controls absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 md:flex">
      {<button type="button" aria-label={interfaceCopy(locale).previousSlide} onClick={() => goTo((current - 1 + slides.length) % slides.length)} className="destekol-slide-arrow">←</button>}
      {slides.map((_, index) => (<button key={index} type="button" onClick={() => goTo(index)} aria-label={`${interfaceCopy(locale).goToSlide} ${index + 1}`} aria-current={index === current
                        ? "true"
                        : undefined} className={`rounded-full transition-all ${index === current
                        ? "h-6 w-2 bg-white"
                        : "h-2 w-2 bg-white/40 hover:bg-white/70"}`}/>))}
      {<button type="button" aria-label={interfaceCopy(locale).nextSlide} onClick={next} className="destekol-slide-arrow">→</button>}
    </div>)}

        </div>}
      {/* Quick Donation */}

      {mode !== "hero" && <div className="hero-quick-donate relative z-20 w-full border-t border-white/15 shadow-2xl backdrop-blur-xl" style={{
                backgroundColor: primary,
            }}>
        <div className="mx-auto max-w-screen-xl px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="hidden shrink-0 lg:block">
              <div className="text-sm font-bold text-white">
                {t("donate.title", "التبرع السريع", "Quick Donate", "Don Rapide", "Hızlı Bağış")}
              </div>

              <div className="text-xs text-white/80">
                {t("donate.secure", "معاملات مشفرة وآمنة", "100% Secure & Encrypted", "Sécurisé & Chiffré", "Güvenli ve Şifreli")}
              </div>
            </div>

            {/* Frequency */}

            <div className="flex shrink-0 rounded-xl border border-white/15 bg-white/15 p-1">
              {([
                "ONE_TIME",
                "MONTHLY",
            ] as const).map((value) => (<button key={value} type="button" onClick={() => setFreq(value)} className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${freq === value
                    ? "bg-white shadow-sm"
                    : "text-white/80 hover:text-white"}`} style={{
                    color: freq === value
                        ? primary
                        : undefined,
                }}>
                  {value ===
                    "ONE_TIME"
                    ? t("donate.one_time", "مرة واحدة", "One-time", "Unique", "Tek")
                    : t("donate.monthly", "شهري", "Monthly", "Mensuel", "Aylık")}
                </button>))}
            </div>

            {/* Amounts */}

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(Array.isArray(data?.amounts) && data.amounts.length ? data.amounts.map((v: any) => Number(v.value ?? v)).filter((v: number) => Number.isFinite(v) && v > 0) : []).map((value: number) => (<button key={value} type="button" onClick={() => {
                    setAmount(value);
                    setCustom("");
                }} className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${final === value &&
                    !custom
                    ? "bg-white shadow-md"
                    : "border border-white/15 bg-white/15 text-white hover:bg-white/25"}`} style={{
                    color: final === value &&
                        !custom
                        ? primary
                        : undefined,
                }}>
                    ${value}
                  </button>))}
            </div>

            {/* Custom */}

            <div className="relative shrink-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/80">
                $
              </span>

              <input type="number" min={1} value={custom} onChange={(e) => setCustom(e.target.value)} aria-label={interfaceCopy(locale).customAmount} placeholder={t("donate.custom", "مبلغ آخر", "Other", "Autre", "Diğer")} className="w-24 rounded-xl border border-white/20 bg-white/15 py-1.5 pl-6 pr-3 text-xs text-white placeholder-white/50 transition focus:border-white/50 focus:outline-none"/>
            </div>

            {/* CTA */}

            <button type="button" onClick={() => {
                setShowDetails((value) => !value);
                setPayError("");
            }} disabled={!final || final <= 0} className="ms-auto flex shrink-0 items-center gap-2 rounded-xl px-6 py-2 text-xs font-bold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50" style={{
                background: accent,
            }}>
              <Icon name="heart" size={14}/>

              {t("donate.title", "تبرع بـ", "Donate", "Faire un Don", "Bağış")}{" "}
              ${final}

              {freq ===
                "MONTHLY" && (<span className="text-[10px] opacity-75">
                  /
                  {t("donate.monthly", "شهر", "mo", "mois", "ay")}
                </span>)}
            </button>
          </div>

          {/* Details */}

          {showDetails && (<div className="mt-4 animate-fadeIn border-t border-white/15 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="min-w-48 flex-1">
                  <label htmlFor="donor-full-name" className="mb-1 block text-xs font-medium text-white/80">
                    {t("donate.name", "الاسم الكامل", "Full Name", "Nom Complet", "Ad Soyad")}
                  </label>

                  <input id="donor-full-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-white/20 bg-white/15 px-3 py-2 text-xs text-white focus:border-white/50 focus:outline-none"/>
                </div>

                <div className="min-w-48 flex-1">
                  <label htmlFor="donor-email" className="mb-1 block text-xs font-medium text-white/80">
                    {t("donate.email", "البريد الإلكتروني", "Email", "Email", "E-posta")}
                  </label>

                  <input id="donor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="w-full rounded-xl border border-white/20 bg-white/15 px-3 py-2 text-xs text-white focus:border-white/50 focus:outline-none"/>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <PayTRMethods locale={locale} monthly={freq === "MONTHLY"} onCollapse={() => { setShowDetails(false); setPayError(""); }}/>



                  <button type="button" onClick={handleAddToCart} className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition ${cartAdded
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
                    : "border-white/20 bg-white/15 text-white hover:bg-white/25"}`}>
                    <Icon name={cartAdded
                    ? "check"
                    : "layers"} size={14}/>

                    {cartAdded
                    ? t("added", "أُضيف ✓", "Added ✓", "Ajouté ✓", "Eklendi ✓")
                    : t("add_to_cart", "السلة", "Cart", "Panier", "Sepet")}
                  </button>
                </div>
              </div>

              {payError && (<p className="mt-2 text-xs font-medium text-red-200">
                  {payError}
                </p>)}
            </div>)}
        </div>
      </div>}
    </section>);
}
