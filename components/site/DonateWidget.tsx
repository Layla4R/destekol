"use client";
import Icon from "@/components/icons";
import { useEffect,useState } from "react";
const AMOUNTS = [5, 10, 25, 50, 100, 250];
export default function DonateWidget({ locale, dict, primaryColor, accentColor, data, isDestekol = false }: {
    locale: string;
    dict: Record<string, string>;
    primaryColor?: string | null;
    accentColor?: string | null;
    data?: any;
    isDestekol?: boolean;
}) {
    const [mounted, setMounted] = useState(false);
    const [amount, setAmount] = useState(25);
    const [custom, setCustom] = useState("");
    const [freq, setFreq] = useState<"ONE_TIME" | "MONTHLY">("ONE_TIME");
    const [step, setStep] = useState<"amount" | "details">("amount");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState<"stripe" | "paypal" | null>(null);
    const [error, setError] = useState("");
    useEffect(() => {
        setMounted(true);
    }, []);
    const final = custom ? Math.max(1, Number(custom)) : amount;
    const t = (key: string, ar: string, en: string, fr: string, tr: string) => dict[key] || (locale === "ar" ? ar : locale === "fr" ? fr : locale === "tr" ? tr : en);
    const title = data?.headline || data?.title || t("donate.widget_title", "كل درهم يغير حياة", "Every Dollar Changes a Life", "Chaque Euro Change une Vie", "Her Dolar Bir Hayat Değiştirir");
    const subtitle = data?.subheading || data?.subtitle || data?.body || data?.description || t("donate.widget_body", "تبرعك يصل مباشرة للمستحقين دون وسيط. نحن نضمن الشفافية الكاملة ونوفر تقارير دورية عن أثر تبرعاتك.", "Your donation reaches beneficiaries directly without intermediaries. We guarantee full transparency and provide regular reports on the impact of your donations.", "Votre don parvient directement aux bénéficiaires sans intermédiaires. Nous garantissons une transparence totale.", "Bağışınız doğrudan yararlanıcılara ulaşır. Tam şeffaflık garantisi ve düzenli etki raporları sunuyoruz.");
    const eyebrow = data?.eyebrow || t("donate.eyebrow", "تبرع الآن", "Donate Now", "Faire un Don", "Bağış Yap");
    const primary = primaryColor || "var(--color-brand, #0069D2)";
    const accent = accentColor || "var(--color-accent, #F00F5A)";
    async function pay(provider: "stripe" | "paypal") {
        if (!name.trim() || !email.trim()) {
            setError(t("donate.name", "الاسم والبريد مطلوبان", "Name and email required", "Nom et email requis", "Ad ve e-posta gerekli"));
            return;
        }
        setLoading(provider);
        setError("");
        try {
            const res = await fetch(provider === "stripe" ? "/api/donations/checkout" : "/api/donations/paypal", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: final, frequency: freq, donorName: name, donorEmail: email }),
            });
            const d = await res.json();
            if (d.url)
                window.location.href = d.url;
            else
                setError(d.error || t("common.error", "حدث خطأ", "Error", "Erreur", "Hata"));
        }
        catch {
            setError(t("common.error", "حدث خطأ", "Error", "Erreur", "Hata"));
        }
        finally {
            setLoading(null);
        }
    }
    const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand placeholder-slate-400";
    return (<section aria-label="Quick Donation Section" className="py-16 bg-slate-50/50 border-t border-slate-100" suppressHydrationWarning>
      <div className="max-w-screen-xl mx-auto px-6">
        
        <div className="bg-white rounded-3xl p-8 lg:p-12 border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <header>
                <div className="inline-flex items-center gap-2 text-brand font-semibold text-xs tracking-widest uppercase mb-3 px-3 py-1 bg-brand/5 rounded-full w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand"/>
                  <span>{eyebrow}</span>
                </div>
                
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
                  {title}
                </h2>
                
                <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-8">
                  {subtitle}
                </p>
              </header>

              <ul className="grid sm:grid-cols-2 gap-4 m-0 p-0 list-none">
                {[
            { icon: "shield-check" as const, ar: "دفع آمن ومشفر 100%", en: "100% Secure Payment", fr: "Paiement 100% Sécurisé", tr: "100% Güvenli Ödeme" },
            { icon: "hand-heart" as const, ar: "وصول مباشر للمستحق", en: "Direct Impact", fr: "Impact Direct", tr: "Doğrudan Etki" },
            { icon: "file-text" as const, ar: "تقارير شفافية دورية", en: "Transparency Reports", fr: "Rapports de transparence", tr: "Şeffaflık Raporları" },
            { icon: "globe" as const, ar: "بيانات الشركة متاحة للتحقق", en: "Company Registration Available", fr: "Enregistrement de la société consultable", tr: "Şirket kaydı doğrulanabilir" },
        ].map((item, i) => (<li key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100/80">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/60 text-brand flex items-center justify-center shrink-0 shadow-sm">
                      <Icon name={item.icon} size={18}/>
                    </div>
                    <span className="text-slate-700 text-xs font-semibold leading-snug">
                      {t(`donate.feat${i}`, item.ar, item.en, item.fr, item.tr)}
                    </span>
                  </li>))}
              </ul>
            </div>

            {/* Right Column */}
            <aside aria-label="Donation Payment Form" className="lg:col-span-6">
              <div className="rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden transition-colors" style={{ backgroundColor: primary }} suppressHydrationWarning>
                <header className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-white font-display font-bold text-lg">
                      {t("donate.title", "مربع التبرع السريع", "Quick Donation", "Don Rapide", "Hızlı Bağış")}
                    </h3>
                    <p className="text-white/80 text-xs mt-0.5">
                      {t("donate.secure", "معاملات شفافة وآمنة", "Secure & Transparent", "Sécurisé & Transparent", "Güvenli ve Şeffaf")}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold tracking-wider bg-white/10 px-3 py-1 rounded-full text-white/90 border border-white/15">
                    {"Destekol"}
                  </span>
                </header>

                {step === "amount" ? (<div className="space-y-4">
                    <div className="flex bg-white/10 p-1 rounded-2xl border border-white/10">
                      {(["ONE_TIME", "MONTHLY"] as const).map(f => (<button key={f} type="button" onClick={() => setFreq(f)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${freq === f ? "bg-white text-slate-900 shadow-md" : "text-white/70 hover:text-white"}`}>
                          {f === "ONE_TIME"
                    ? t("donate.one_time", "مرة واحدة", "One-time", "Unique", "Tek Seferlik")
                    : t("donate.monthly", "شهري", "Monthly", "Mensuel", "Aylık")}
                        </button>))}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {AMOUNTS.map(a => (<button key={a} type="button" onClick={() => { setAmount(a); setCustom(""); }} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${final === a && !custom
                    ? "bg-white text-slate-900 shadow-md"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"}`}>
                          ${a}
                        </button>))}
                    </div>

                    <div className="relative">
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/80 text-xs font-bold">$</span>
                      <input type="number" min={1} value={custom} onChange={e => setCustom(e.target.value)} aria-label="Custom Amount" placeholder={t("donate.custom", "مبلغ آخر...", "Custom amount...", "Autre montant...", "Özel miktar...")} className="w-full bg-white/10 border border-white/15 focus:border-white/40 rounded-xl py-2.5 pr-8 pl-3.5 text-white placeholder-white/40 text-xs focus:outline-none transition"/>
                    </div>

                    <button type="button" onClick={() => setStep("details")} className="w-full hover:opacity-90 active:scale-98 text-white font-bold rounded-2xl py-3.5 text-sm shadow-lg transition-all flex items-center justify-center gap-2 mt-2" style={{ backgroundColor: accent }}>
                      <Icon name="heart" size={18}/>
                      <span>{t("donate.title", "تبرع بـ", "Donate", "Faire un Don", "Bağış Yap")} ${final}</span>
                      {freq === "MONTHLY" && <span className="text-white/70 text-xs font-normal">/{t("donate.monthly", "شهر", "month", "mois", "ay")}</span>}
                    </button>

                    <p className="text-white/80 text-[11px] text-center flex items-center justify-center gap-1 pt-1">
                      <Icon name="shield-check" size={12}/>
                      <span>{t("donate.secure", "دفع آمن ومشفر 100%", "100% Secure encrypted payment", "Paiement 100% sécurisé", "100% Güvenli ödeme")}</span>
                    </p>
                  </div>) : (<div className="space-y-3">
                    <div className="flex items-center justify-between bg-white/10 p-2.5 rounded-xl border border-white/10 mb-1">
                      <span className="text-white/80 text-xs font-medium" suppressHydrationWarning>
                        {freq === "MONTHLY" ? t("donate.monthly", "شهري", "Monthly", "Mensuel", "Aylık") : t("donate.one_time", "مرة واحدة", "One-time", "Unique", "Tek Seferlik")} — <strong className="text-white font-bold">${final}</strong>
                      </span>
                      <button type="button" onClick={() => { setStep("amount"); setError(""); }} className="text-white/70 hover:text-white text-xs underline">
                        {t("campaigns.edit", "تعديل", "Edit", "Modifier", "Düzenle")}
                      </button>
                    </div>

                    <input value={name} onChange={e => setName(e.target.value)} aria-label={t("donate.name", "الاسم الكامل", "Full Name", "Nom Complet", "Ad Soyad")} placeholder={t("donate.name", "الاسم الكامل", "Full Name", "Nom Complet", "Ad Soyad")} className={inp}/>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} aria-label={t("donate.email", "البريد الإلكتروني", "Email Address", "Adresse Email", "E-posta")} placeholder={t("donate.email", "البريد الإلكتروني", "Email Address", "Adresse Email", "E-posta")} className={inp}/>
                    
                    {error && <p className="text-red-300 text-xs">{error}</p>}
                    
                    <button type="button" onClick={() => pay("stripe")} disabled={!!loading} className="w-full bg-white text-slate-900 font-bold rounded-xl py-2.5 transition hover:bg-slate-100 disabled:opacity-60 flex items-center justify-center gap-2 text-xs shadow-sm">
                      <Icon name="wallet" size={15}/>
                      <span>{loading === "stripe" ? "..." : `${t("donate.pay_card", "الدفع بالبطاقة", "Pay with Card", "Payer par Carte", "Kart ile Öde")} — $${final}`}</span>
                    </button>
                    
                    <button type="button" onClick={() => pay("paypal")} disabled={!!loading} className="w-full bg-[#FFC439] hover:bg-[#ffcd54] text-[#003087] font-bold rounded-xl py-2.5 transition disabled:opacity-60 flex items-center justify-center gap-2 text-xs">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#003087"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/></svg>
                      <span>{loading === "paypal" ? "..." : `PayPal — $${final}`}</span>
                    </button>
                  </div>)}
              </div>
            </aside>

          </div>
        </div>

      </div>
    </section>);
}
