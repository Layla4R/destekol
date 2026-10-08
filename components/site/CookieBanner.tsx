"use client";
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cookieDisclosures } from '@/lib/cookie-disclosures';
import { useEffect, useState } from 'react';
import { CONSENT_KEY, CONSENT_EVENT, readConsent, trackingAllowed, clearTrackingCookies, type CookieConsent } from '@/lib/cookie-consent';

const words = {
    ar: { title: 'تفضيلات ملفات تعريف الارتباط', text: 'الملفات الضرورية تعمل دائمًا. اختر السماح بالتحليلات أو التسويق أو المحتوى الخارجي.', settings: 'إعدادات ملفات الارتباط', accept: 'قبول الكل', reject: 'رفض غير الضرورية', save: 'حفظ اختياري', analytics: 'التحليلات', marketing: 'التسويق', functional: 'المحتوى الخارجي', policy: 'سياسة ملفات تعريف الارتباط', details: 'المزوّد والغرض والمدة' },
    en: { title: 'Cookie preferences', text: 'Essential cookies remain active. Choose whether to allow analytics, marketing or external content.', settings: 'Cookie settings', accept: 'Accept all', reject: 'Reject non-essential', save: 'Save my choices', analytics: 'Analytics', marketing: 'Marketing', functional: 'External content', policy: 'Cookie policy', details: 'Provider, purpose and duration' },
    fr: { title: 'Préférences de cookies', text: 'Les cookies nécessaires restent actifs. Choisissez d’autoriser les analyses, le marketing ou le contenu externe.', settings: 'Paramètres des cookies', accept: 'Tout accepter', reject: 'Refuser les non nécessaires', save: 'Enregistrer mes choix', analytics: 'Analyse', marketing: 'Marketing', functional: 'Contenu externe', policy: 'Politique relative aux cookies', details: 'Fournisseur, finalité et durée' },
    tr: { title: 'Çerez tercihleri', text: 'Zorunlu çerezler her zaman aktiftir. Analitik, pazarlama veya harici içerik için tercih yapın.', settings: 'Çerez ayarları', accept: 'Tümünü kabul et', reject: 'Zorunlu olmayanları reddet', save: 'Tercihlerimi kaydet', analytics: 'Analitik', marketing: 'Pazarlama', functional: 'Harici içerik', policy: 'Çerez politikası', details: 'Sağlayıcı, amaç ve süre' },
};
export default function CookieBanner({ locale = 'tr', gaId, gtmId, pixelId }: { locale?: string; isDestekol?: boolean; gaId?: string | null; gtmId?: string; pixelId?: string }) {
    const privateTracking = /\/(?:contact\/track|unsubscribe)\/?$/.test(usePathname() || '');
    const t = words[locale as keyof typeof words] || words.tr;
    const [consent, setConsent] = useState<CookieConsent | null>(null);
    const [open, setOpen] = useState(false);
    const [choices, setChoices] = useState({ analytics: false, marketing: false, functional: false });
    useEffect(() => {
        const existing = readConsent(); setConsent(existing); setOpen(!existing);
        if (existing) setChoices(existing);
        const sync = (event: StorageEvent) => { if (event.key === CONSENT_KEY) window.location.reload(); };
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);
    function save(selected: typeof choices) {
        const next: CookieConsent = { version: 2, updatedAt: new Date().toISOString(), ...selected };
        try { localStorage.setItem(CONSENT_KEY, JSON.stringify(next)); } catch { /* Apply choices for this visit. */ }
        const changed = consent && ['analytics', 'marketing', 'functional'].some(key => consent[key as keyof typeof choices] !== selected[key as keyof typeof choices]);
        const w = window as any;
        if (!selected.marketing) w.fbq?.('consent', 'revoke');
        if (!selected.analytics || !selected.marketing) w.gtag?.('consent', 'update', { analytics_storage: selected.analytics ? 'granted' : 'denied', ad_storage: selected.marketing ? 'granted' : 'denied', ad_user_data: selected.marketing ? 'granted' : 'denied', ad_personalization: selected.marketing ? 'granted' : 'denied' });
        clearTrackingCookies(); setConsent(next); setOpen(false);
        window.dispatchEvent(new Event(CONSENT_EVENT));
        // Reload removes previously loaded third-party code after a preference change.
        if (changed) window.location.reload();
    }
    const ga = gaId && /^G-[A-Z0-9]+$/i.test(gaId) ? gaId : null;
    const gtm = gtmId && /^GTM-[A-Z0-9]+$/i.test(gtmId) ? gtmId : null;
    const meta = pixelId && /^\d+$/.test(pixelId) ? pixelId : null;
    return <>
        {!privateTracking && trackingAllowed(consent, 'gtm') && gtm ? <Script id="consented-gtm">{`window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id=${gtm}';document.head.appendChild(s);`}</Script> : !privateTracking && trackingAllowed(consent, 'ga') && ga ? <><Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}/><Script id="consented-ga">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});gtag('js',new Date());gtag('config','${ga}');`}</Script></> : null}
        {!privateTracking && trackingAllowed(consent, 'meta') && meta && <Script id="consented-meta">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=true;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('consent','grant');fbq('init','${meta}');fbq('track','PageView');`}</Script>}
        {open && <div role="dialog" aria-modal="true" aria-label={t.title} className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 p-3 sm:items-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
                <h2 className="text-lg font-bold mb-3">{t.title}</h2><p className="text-sm mb-4">{t.text}</p>
                <div className="space-y-3 mb-4">{(['analytics', 'marketing', 'functional'] as const).map(category => <label key={category} className="flex items-center gap-3"><input type="checkbox" checked={choices[category]} onChange={e => setChoices({ ...choices, [category]: e.target.checked })}/>{t[category]}</label>)}</div>
                <details className="mb-4 text-xs leading-relaxed"><summary className="cursor-pointer font-bold">{t.details}</summary>{(cookieDisclosures[locale] || cookieDisclosures.tr).map(text => <p key={text} className="mt-2">{text}</p>)}<p className="mt-2"><a className="underline" href="https://policies.google.com/technologies/cookies" target="_blank" rel="noreferrer">Google / YouTube / Maps</a> · <a className="underline" href="https://www.facebook.com/privacy/policies/cookies/" target="_blank" rel="noreferrer">Meta</a></p></details>
                <Link href={`/${locale}/cookie-policy`} className="text-sm text-brand underline">{t.policy}</Link>
                <div className="mt-5 grid grid-cols-2 gap-3"><button className="rounded-lg border border-brand py-3 text-sm font-bold" onClick={() => save({ analytics: false, marketing: false, functional: false })}>{t.reject}</button><button className="rounded-lg border border-brand py-3 text-sm font-bold" onClick={() => save({ analytics: true, marketing: true, functional: true })}>{t.accept}</button><button className="col-span-2 rounded-lg bg-brand py-3 text-sm font-bold text-white" onClick={() => save(choices)}>{t.save}</button></div>
            </div>
        </div>}
    </>;
}
