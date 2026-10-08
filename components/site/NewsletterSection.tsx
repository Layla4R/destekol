"use client";
import NewsletterChoice from './NewsletterChoice';
import {NEWSLETTER_CONSENT_VERSION} from '@/lib/newsletter-consent';
import Icon from "@/components/icons";
import { useEffect,useState } from "react";
interface NewsletterProps {
    locale: string;
    dict: Record<string, string>;
    primaryColor?: string | null;
    accentColor?: string | null;
    data?: any;
}
export default function NewsletterSection({ locale, dict, primaryColor, accentColor, data }: NewsletterProps) {
    const [consent,setConsent]=useState(false);
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const isRTL = locale === "ar";
    const t = (key: string, ar: string, en: string, fr: string, tr: string) => dict[key] || (locale === "ar" ? ar : locale === "fr" ? fr : locale === "tr" ? tr : en);
    const sectionTitle = data?.title || t("newsletter.title", "اشترك في نشرتنا البريدية", "Subscribe to Our Newsletter", "Abonnez-vous à Notre Newsletter", "Bültenimize Abone Olun");
    const sectionSubtitle = data?.subtitle || t("newsletter.subtitle", "كن أول من يعلم بأثر تبرعاته وآخر أخبار حملاتنا الإنسانية مباشرة في بريدك.", "Be the first to know about your donation impact and the latest from our humanitarian campaigns.", "Soyez le premier informé de l'impact de vos dons et des dernières nouvelles de nos campagnes.", "Bağışlarınızın etkisini ve insani kampanyalarımızın son haberlerini ilk öğrenen siz olun.");
    const primary = primaryColor || "var(--color-brand, #0069D2)";
    const accent = accentColor || "var(--color-accent, #F00F5A)";
    async function subscribe(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !consent)
            return;
        setStatus("loading");
        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email,locale,marketingConsent:consent,consentVersion:NEWSLETTER_CONSENT_VERSION }),
            });
            const result=await res.json();
            setStatus(res.ok && result.ok ? "success" : "error");
            if (res.ok && result.ok)
                setEmail("");
        }
        catch {
            setStatus("error");
        }
    }
    return (<section aria-labelledby="newsletter-heading" className="py-20 bg-slate-50/50 border-t border-slate-100" suppressHydrationWarning>
      <div className="max-w-screen-xl mx-auto px-6">
        
        {/* Floating Container */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-14 lg:p-16 shadow-2xl text-center transition-colors" style={{ backgroundColor: primary }} suppressHydrationWarning>
          
          {/* Decorative Blur Effects */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" aria-hidden="true"/>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" aria-hidden="true"/>

          <div className="relative z-10 max-w-2xl mx-auto">
            
            {/* Header Section */}
            <header className="mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 border border-white/20 text-white mb-6 backdrop-blur-md shadow-sm">
                <Icon name="mail" size={24}/>
              </div>

              <span className="block text-white/70 font-semibold text-xs tracking-widest uppercase mb-3" suppressHydrationWarning>
                {t("newsletter.eyebrow", "ابقَ على تواصل", "Stay Connected", "Restez Connecté", "Bağlı Kalın")}
              </span>

              <h2 id="newsletter-heading" className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight" suppressHydrationWarning>
                {sectionTitle}
              </h2>

              <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-lg mx-auto" suppressHydrationWarning>
                {sectionSubtitle}
              </p>
            </header>

            {/* Form Section */}
            {status === "success" ? (<div className="inline-flex items-center gap-3 bg-white/20 border border-white/30 text-white font-bold rounded-2xl px-6 py-3.5 text-sm backdrop-blur">
                <span className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center shrink-0">
                  <Icon name="check" size={14}/>
                </span>
                <span suppressHydrationWarning>
                  {t("newsletter.success", "شكراً! تم تسجيل بريدك بنجاح ✨", "Thank you! You're now subscribed ✨", "Merci ! Vous êtes maintenant abonné ✨", "Teşekkürler! Başarıyla abone oldunuz ✨")}
                </span>
              </div>) : (<form onSubmit={subscribe} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row items-center bg-white rounded-2xl p-1.5 shadow-xl border border-white/20 gap-2">
                  <div className="relative flex-1 w-full">
                    <Icon name="mail" size={16} className={`absolute top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none ${isRTL ? "right-4" : "left-4"}`}/>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t("newsletter.placeholder", "بريدك الإلكتروني...", "Your email address...", "Votre adresse email...", "E-posta adresiniz...")} aria-label={t("newsletter.placeholder", "بريدك الإلكتروني...", "Your email address...", "Votre adresse email...", "E-posta adresiniz...")} className={`w-full bg-transparent text-slate-900 placeholder-slate-400 py-3 text-xs sm:text-sm font-medium focus:outline-none ${isRTL ? "pr-11 pl-4" : "pl-11 pr-4"}`}/>
                  </div>

                  <button type="submit" disabled={status === "loading"} className="w-full sm:w-auto shrink-0 hover:opacity-90 active:scale-98 disabled:opacity-60 text-white font-bold rounded-xl px-7 py-3 text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 justify-center" style={{ backgroundColor: accent }}>
                    {status === "loading" ? ("...") : (<>
                        <span suppressHydrationWarning>{t("newsletter.btn", "اشترك الآن", "Subscribe", "S'abonner", "Abone Ol")}</span>
                        <Icon name="send" size={14} className={isRTL ? "rotate-180" : ""}/>
                      </>)}
                  </button>
                </div>
                <div className="text-white"><NewsletterChoice locale={locale} checked={consent} onChange={setConsent}/></div>
              </form>)}

            {status === "error" && (<p className="mt-3 text-red-200 text-xs font-medium" suppressHydrationWarning>
                {t("newsletter.error", "حدث خطأ، حاول مجدداً.", "Something went wrong, please try again.", "Une erreur s'est produite.", "Bir hata oluştu.")}
              </p>)}

            {/* Trust Note wrapped in Footer */}
            <footer className="mt-6 text-white/80 text-[11px] flex items-center justify-center gap-1.5">
              <Icon name="shield-check" size={13}/>
              <span suppressHydrationWarning>
                {t("newsletter.trust", "يمكنك إلغاء الاشتراك في أي وقت عبر الرابط في رسائلنا.", "You can unsubscribe at any time using the link in our emails.", "Vous pouvez vous désabonner à tout moment via le lien dans nos e-mails.", "E-postalarımızdaki bağlantıyla istediğiniz zaman aboneliğinizi iptal edebilirsiniz.")}
              </span>
            </footer>

          </div>

        </div>
      </div>
    </section>);
}
