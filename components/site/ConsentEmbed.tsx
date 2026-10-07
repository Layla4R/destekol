'use client';
import { useEffect, useState, type IframeHTMLAttributes } from 'react';
import { readConsent, CONSENT_EVENT } from '@/lib/cookie-consent';
export default function ConsentEmbed(props: IframeHTMLAttributes<HTMLIFrameElement>) {
    const [allowed, setAllowed] = useState(false);
    const [locale, setLocale] = useState('tr');
    useEffect(() => {
        const update = () => setAllowed(!!readConsent()?.functional);
        setLocale(document.documentElement.lang || 'tr');
        update(); window.addEventListener(CONSENT_EVENT, update);
        return () => window.removeEventListener(CONSENT_EVENT, update);
    }, []);
    if (allowed) return <iframe {...props}/>;
    const text = ({ ar: 'المحتوى الخارجي محجوب وفق اختيارك لملفات الارتباط.', en: 'External content is blocked according to your cookie choice.', fr: 'Le contenu externe est bloqué conformément à votre choix de cookies.', tr: 'Harici içerik, çerez tercihiniz doğrultusunda engellendi.' } as Record<string, string>)[locale] || 'External content is blocked according to your cookie choice.';
    return <div className="flex min-h-40 items-center justify-center rounded-xl bg-slate-100 p-6"><p className="text-sm text-slate-600">{text}</p></div>;
}
