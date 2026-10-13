"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CONSENT_KEY, CONSENT_EVENT, parseConsent, readConsent, type CookieConsent } from "@/lib/cookie-consent";
import { GA_MEASUREMENT_ID, analyticsEnabled, initializeAnalytics, syncAnalyticsConsent, trackFileDownload, trackPageView, trackWebsiteLinkClick } from "@/lib/analytics";

/** Public pages load immediately; consent controls analytics storage, not tag loading. */
export default function GoogleAnalytics() {
    const pathname = usePathname() || "/";
    const query = useSearchParams().toString();
    const [consent, setConsent] = useState<CookieConsent | null>(null);
    useEffect(() => {
        const apply = (next: CookieConsent | null) => { syncAnalyticsConsent(next); setConsent(next); };
        if (/^\/kit\/?$/.test(pathname)) { apply(null); return; }
        apply(readConsent());
        const changed = (event: Event) => {
            const detail = (event as CustomEvent).detail;
            apply(detail ? parseConsent(JSON.stringify(detail)) : readConsent());
        };
        const storage = (event: StorageEvent) => { if (event.key === CONSENT_KEY || event.key === null) apply(parseConsent(event.newValue)); };
        window.addEventListener(CONSENT_EVENT, changed);
        window.addEventListener("storage", storage);
        return () => { window.removeEventListener(CONSENT_EVENT, changed); window.removeEventListener("storage", storage); };
    }, [pathname]);
    useEffect(() => {
        if (analyticsEnabled(pathname) && initializeAnalytics()) trackPageView(`${pathname}?${query}`);
    }, [pathname, query, consent]);
    useEffect(() => {
        const download = (event: MouseEvent) => {
            if (event.type === "auxclick" && event.button !== 1) return;
            if (/^\/kit\/?$/.test(window.location.pathname)) return;
            const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
            if (target && !target.closest("[data-resource]")) {
                trackWebsiteLinkClick(target.href);
                trackFileDownload(target.href);
            }
        };
        document.addEventListener("click", download);
        document.addEventListener("auxclick", download);
        return () => { document.removeEventListener("click", download); document.removeEventListener("auxclick", download); };
    }, []);
    return analyticsEnabled(pathname)
        ? <Script id="destekol-ga4" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" /> : null;
}
