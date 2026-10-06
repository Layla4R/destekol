"use client";
import { LOCALES,LOCALE_NAMES,type Locale } from "@/i18n";
import { usePathname,useRouter } from "next/navigation";
import { useState } from "react";
import FlagIcon from "./FlagIcon";
export default function LanguageSwitcher({ currentLocale, transparent = false, isDestekol = false }: {
    currentLocale: string;
    transparent?: boolean;
    isDestekol?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const current = currentLocale as Locale;
    function switchLocale(newLocale: Locale) {
        setOpen(false);
        if (newLocale === current)
            return;
        // Remove ALL locale prefixes from current path
        let base = pathname;
        for (const loc of LOCALES) {
            if (pathname === `/${loc}`) {
                base = "/";
                break;
            }
            if (pathname.startsWith(`/${loc}/`)) {
                base = pathname.slice(loc.length + 1);
                break;
            }
        }
        // base is now the clean path without any locale prefix
        // اللغة الافتراضية بدون بادئة تتغير بحسب الدومين
        const defaultLocale = "tr";
        if (newLocale === defaultLocale) {
            // اللغة الافتراضية للدومين تفتح بدون بادئة
            router.push(`/${newLocale}${base === "/" ? "" : base}`);
        }
        else {
            // باقي اللغات تضاف البادئة الخاصة بها صراحة (مثل /ar أو /en)
            router.push(`/${newLocale}${base === "/" ? "" : base}`);
        }
        router.refresh();
    }
    return (<div className="relative">
      <button onClick={() => setOpen(o => !o)} className={`flex items-center gap-2 text-sm font-semibold rounded-xl px-3 py-2 transition border ${transparent ? "border-white/30 text-white hover:bg-white/15 bg-transparent" : "border-line text-ink/70 hover:text-brand hover:border-brand bg-white"}`}>
        <FlagIcon locale={current} size={18}/>
        <span className="hidden sm:inline">{LOCALE_NAMES[current]}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {open && (<>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}/>
          <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-line py-1.5 w-48 z-50">
            {LOCALES.map(locale => (<button key={locale} onClick={() => switchLocale(locale)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-beige ${locale === current ? "font-bold text-brand bg-brand/5" : "text-ink"}`}>
                <FlagIcon locale={locale} size={18}/>
                <span className="flex-1 text-left">{LOCALE_NAMES[locale]}</span>
                {locale === current && (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m20 6-11 11-5-5"/></svg>)}
              </button>))}
          </div>
        </>)}
    </div>);
}
