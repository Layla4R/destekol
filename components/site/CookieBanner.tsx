"use client";
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CONSENT_KEY, CONSENT_EVENT, readConsent, trackingAllowed, clearTrackingCookies, type CookieConsent } from '@/lib/cookie-consent';

const words = {
    ar: { label: 'إشعار ملفات تعريف الارتباط', intro: 'نحن نظهر هذه الرسالة لأننا نحترم خصوصيتك', emphasis: 'نستخدم ملفات تعريف الارتباط لتقديم تجربة مستخدم أفضل 😊', accept: 'قبول', reject: 'رفض' },
    en: { label: 'Cookie notice', intro: 'We show this message because we respect your privacy', emphasis: 'We use cookies to provide a better user experience 😊', accept: 'Accept', reject: 'Reject' },
    fr: { label: 'Avis relatif aux cookies', intro: 'Nous affichons ce message parce que nous respectons votre vie privée', emphasis: 'Nous utilisons des cookies pour vous offrir une meilleure expérience utilisateur 😊', accept: 'Accepter', reject: 'Refuser' },
    tr: { label: 'Çerez bildirimi', intro: 'Gizliliğinize saygı duyduğumuz için bu mesajı gösteriyoruz', emphasis: 'Daha iyi bir kullanıcı deneyimi sunmak için çerez kullanıyoruz 😊', accept: 'Kabul et', reject: 'Reddet' },
};
const closeLabels = { ar: 'إغلاق', en: 'Close', fr: 'Fermer', tr: 'Kapat' };
type Choices = Pick<CookieConsent, 'analytics' | 'marketing' | 'functional'>;
export default function CookieBanner({ locale = 'tr', pixelId }: { locale?: string; isDestekol?: boolean; pixelId?: string }) {
    const privateTracking = /\/(?:contact\/track|unsubscribe)\/?$/.test(usePathname() || '');
    const t = words[locale as keyof typeof words] || words.tr;
    const [consent, setConsent] = useState<CookieConsent | null>(null);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const existing = readConsent(); setConsent(existing); setOpen(!existing);
        const sync = (event: StorageEvent) => { if (event.key === CONSENT_KEY) window.location.reload(); };
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);
    function save(selected: Choices) {
        const next: CookieConsent = { version: 2, updatedAt: new Date().toISOString(), ...selected };
        try { localStorage.setItem(CONSENT_KEY, JSON.stringify(next)); } catch { /* Apply choices for this visit. */ }
        const changed = consent && ['analytics', 'marketing', 'functional'].some(key => consent[key as keyof Choices] !== selected[key as keyof Choices]);
        const w = window as any;
        if (!selected.marketing) w.fbq?.('consent', 'revoke');
        if (!selected.analytics) w.gtag?.('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
        clearTrackingCookies(); setConsent(next); setOpen(false);
        window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: next }));
        // Reload removes previously loaded third-party code after a preference change.
        if (changed) window.location.reload();
    }
    const meta = pixelId && /^\d+$/.test(pixelId) ? pixelId : null;
    return <>
        {!privateTracking && trackingAllowed(consent, 'meta') && meta && <Script id="consented-meta">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=true;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('consent','grant');fbq('init','${meta}');fbq('track','PageView');`}</Script>}
        {open && <div role="dialog" aria-modal="true" aria-label={t.label} className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 p-3 sm:items-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
                <div className="flex justify-end"><button type="button" aria-label={closeLabels[locale as keyof typeof closeLabels] || closeLabels.tr} className="text-2xl leading-none" onClick={() => setOpen(false)}>×</button></div>
                <p className="mb-5 text-sm">{t.intro}<strong className="mt-2 block">{t.emphasis}</strong></p>
                <div className="grid grid-cols-2 gap-3"><button type="button" className="rounded-lg border border-brand py-3 text-sm font-bold" onClick={() => save({ analytics: false, marketing: false, functional: false })}>{t.reject}</button><button type="button" className="rounded-lg border border-brand py-3 text-sm font-bold" onClick={() => save({ analytics: true, marketing: true, functional: true })}>{t.accept}</button></div>
            </div>
        </div>}
    </>;
}
