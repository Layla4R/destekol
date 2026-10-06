"use client";
import Icon from "@/components/icons";
import { OFFICIAL_EMAIL } from "@/lib/public-contact";
import { useState } from "react";
export default function FaqSection({ email = "", locale, dict, data, }: {
    email?: string;
    locale: string;
    dict: Record<string, string>;
    data?: any;
}) {
    const [open, setOpen] = useState<number | null>(0);
    const t = (key: string, ar: string, en: string, fr: string, tr: string) => dict[key] ||
        (locale === "ar" ? ar : locale === "fr" ? fr : locale === "tr" ? tr : en);
    const title = data?.headline || data?.title;
    const subtitle = data?.subheading || data?.subtitle || data?.description;
    const items = Array.isArray(data?.items) ? data.items : [];
    if (!title && items.length === 0)
        return null;
    // توليد Schema.org JSON-LD آلياً لفهرسة الذكاء الاصطناعي
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": items.map((item: any) => ({
            "@type": "Question",
            "name": item.q || item.question || item.title,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.a || item.answer || item.content || item.body,
            },
        })),
    };
    return (<section className="py-6 bg-slate-50/50 border-t border-slate-100">
      {/* حقن JSON-LD Schema للذكاء الاصطناعي ومحركات البحث */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}/>

      <div className="max-w-screen-xl mx-auto px-6">
        {/* Header */}
        {(title || subtitle) && (<header className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-brand font-semibold text-xs tracking-widest uppercase mb-3 px-3 py-1 bg-brand/5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-brand"/>
              {t("faq.eyebrow", "أسئلة المتبرعين", "Donor Questions", "Questions des Donateurs", "Bağışçı Soruları")}
            </span>

            {title && (<h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                {title}
              </h2>)}

            {subtitle && (<p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                {subtitle}
              </p>)}
          </header>)}

        {/* Semantic Description List (<dl>) */}
        {items.length > 0 && (<div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xl shadow-slate-200/40 w-full mb-10">
            <dl className="divide-y divide-slate-100 m-0 p-0">
              {items.map((item: any, i: number) => {
                const isOpen = open === i;
                const questionText = item.q || item.question || item.title;
                const answerText = item.a || item.answer || item.content || item.body;
                const faqId = `faq-answer-${i}`;
                return (<div key={i} className="py-4 first:pt-0 last:pb-0 transition-colors">
                    <dt>
                      <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} aria-controls={faqId} className="w-full flex items-center justify-between gap-4 py-3 text-start transition-colors group">
                        <span className={`font-display font-bold text-base sm:text-lg leading-snug transition-colors ${isOpen ? "text-brand" : "text-slate-900 group-hover:text-brand"}`}>
                          {questionText}
                        </span>

                        {/* Toggle Icon */}
                        <div className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${isOpen
                        ? "bg-brand border-brand text-white rotate-180 shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-brand/40 group-hover:text-brand"}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                        </div>
                      </button>
                    </dt>

                    {/* الإجابة موجودة دائمًا في DOM لزواحف البحث وتخفى بصريًا فقط */}
                    <dd id={faqId} className={`pt-2 pb-3 text-slate-600 text-sm sm:text-base leading-relaxed m-0 ${isOpen ? "block" : "hidden"}`}>
                      <p className="text-slate-500 leading-loose whitespace-pre-wrap">
                        {answerText}
                      </p>
                    </dd>
                  </div>);
            })}
            </dl>
          </div>)}

        {/* Bottom Help Banner */}
        <aside aria-label="Contact support" className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 w-full">
          <div className="text-start">
            <h4 className="text-slate-900 font-extrabold text-base sm:text-lg mb-1">
              {t("faq.more", "لديك سؤال آخر؟", "Have another question?", "Vous avez une autre question ?", "Başka sorunuz mu var?")}
            </h4>
            <p className="text-slate-500 text-xs sm:text-sm">
              {t("faq.contact_sub", "فريقنا يرد خلال 24 ساعة على أي استفسارات أو استشارات", "Our team responds within 24 hours to any inquiry", "Notre équipe répond sous 24 heures", "Ekibimiz 24 saat içinde yanıt verir")}
            </p>
          </div>

          <a href={`mailto:${email}`} aria-label={`Send email to ${email}`} className="inline-flex items-center gap-2 bg-brand hover:opacity-90 active:scale-98 text-white font-bold rounded-xl px-6 py-3 text-xs sm:text-sm transition-all shadow-sm shrink-0">
            <Icon name="send" size={15}/>
            {t("nav.contact", "تواصل معنا", "Contact Us", "Nous Contacter", "Bize Ulaşın")}
          </a>
        </aside>

      </div>
    </section>);
}
