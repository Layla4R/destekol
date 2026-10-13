import type { CookieConsent } from "@/lib/cookie-consent";
import type { KitLocale, KitResource } from "@/lib/kit-config";

export const GA_MEASUREMENT_ID = "G-KREW1XWX0X";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"];
type AnalyticsRuntime = { consent: CookieConsent | null; configured: boolean; granted: boolean; debug: boolean; lastRoute: string | null; previousLocation: string | null };
type AnalyticsWindow = Window & {
    dataLayer?: unknown[];
    gtag?: (command: string, ...parameters: unknown[]) => void;
    __destekolGA4?: AnalyticsRuntime;
    [key: `ga-disable-${string}`]: boolean;
};

export function isAnalyticsPage(pathname: string): boolean {
    let path;
    try { path = decodeURIComponent(pathname); } catch { return false; }
    if (/@|[\r\n]/.test(path)) return false;
    return !/^\/(?:admin|api|_next)(?:\/|$)/.test(path)
        && !/\/(?:account|login|register|forgot-password|reset-password|verify-email|unsubscribe)(?:\/|$)/.test(path)
        && !/\/(?:contact\/track|donate\/(?:success|cancel))(?:\/|$)/.test(path);
}

export function isAnalyticsHomepage(pathname: string): boolean {
    return /^\/(?:ar|en|tr|fr)?\/?$/.test(pathname);
}

/** Homepage loads in cookieless mode; Kit measures directly; other pages retain the consent gate. */
export function analyticsEnabled(pathname: string, consent: CookieConsent | null): boolean {
    return isAnalyticsPage(pathname) && (pathname === "/kit" || isAnalyticsHomepage(pathname) || consent?.analytics === true);
}

function analyticsStorageGranted(pathname: string, consent: CookieConsent | null): boolean {
    return analyticsEnabled(pathname, consent) && (pathname === "/kit" || consent?.analytics === true);
}

/** Keep campaign attribution, removing tokens, donor IDs, searches and fragments. */
export function analyticsLocation(raw: string): string | null {
    try {
        const url = new URL(raw);
        if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || !isAnalyticsPage(url.pathname)) return null;
        const clean = new URL(url.origin + url.pathname);
        for (const name of UTM_KEYS) {
            const value = url.searchParams.get(name);
            if (value && value.length <= 100 && /^[\p{L}\p{N} _.,~\-]+$/u.test(value)) clean.searchParams.set(name, value);
        }
        return clean.href;
    } catch { return null; }
}

export function analyticsLink(raw: string): string | null {
    if (!raw) return null;
    try {
        const url = new URL(raw, typeof window === "undefined" ? "https://destekol.org" : window.location.origin);
        const safe = analyticsLocation(url.href);
        return safe ? new URL(safe).origin + new URL(safe).pathname : null;
    } catch { return null; }
}

function runtime(): { browser: AnalyticsWindow; state: AnalyticsRuntime } | null {
    if (typeof window === "undefined") return null;
    const browser = window as unknown as AnalyticsWindow;
    browser.__destekolGA4 ||= { consent: null, configured: false, granted: false, debug: false, lastRoute: null, previousLocation: null };
    return { browser, state: browser.__destekolGA4 };
}

export function syncAnalyticsConsent(consent: CookieConsent | null) {
    const current = runtime();
    if (!current) return;
    const { browser, state } = current;
    state.consent = consent;
    const enabled = analyticsEnabled(browser.location.pathname, consent);
    const granted = analyticsStorageGranted(browser.location.pathname, consent);
    browser[`ga-disable-${GA_MEASUREMENT_ID}`] = !enabled;
    if (!granted) {
        state.granted = false;
        browser.gtag?.("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    }
    if (!enabled) {
        state.lastRoute = null;
        if (browser.dataLayer) {
            const kept = browser.dataLayer.filter(entry => (entry as ArrayLike<unknown>)?.[0] !== "event");
            browser.dataLayer.splice(0, browser.dataLayer.length, ...kept);
        }
    }
}

export function initializeAnalytics(): boolean {
    const current = runtime();
    if (!current || !analyticsEnabled(current.browser.location.pathname, current.state.consent)) return false;
    const { browser, state } = current;
    const granted = analyticsStorageGranted(browser.location.pathname, state.consent);
    browser[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
    if (state.configured) {
        if (state.granted !== granted) browser.gtag?.("consent", "update", { analytics_storage: granted ? "granted" : "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
        state.granted = granted;
        return true;
    }
    browser.dataLayer ||= [];
    browser.gtag ||= function () { browser.dataLayer!.push(arguments); };
    state.debug = new URLSearchParams(browser.location.search).get("ga_debug") === "1";
    browser.gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    if (granted) browser.gtag("consent", "update", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    browser.gtag("js", new Date());
    browser.gtag("config", GA_MEASUREMENT_ID, {
        send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
        page_location: analyticsLocation(browser.location.href),
        page_referrer: analyticsLink(browser.document.referrer) || "",
        ...(state.debug ? { debug_mode: true } : {}),
    });
    state.configured = true;
    state.granted = granted;
    return true;
}

export function trackAnalyticsEvent(name: string, parameters: Record<string, string | number | boolean>) {
    const current = runtime();
    if (!current || !analyticsEnabled(current.browser.location.pathname, current.state.consent)
        || !current.state.configured || (!current.state.granted && name !== "page_view")) return;
    const payload = {
        ...parameters, send_to: GA_MEASUREMENT_ID,
        page_location: analyticsLocation(current.browser.location.href),
        ...(current.state.debug ? { debug_mode: true } : {}),
    };
    current.browser.gtag?.("event", name, payload);
    if (current.state.debug && process.env.NODE_ENV === "development") console.debug("[Destekol GA4]", name, JSON.stringify(payload));
}

export function trackPageView(routeKey: string) {
    const current = runtime();
    if (!current || !initializeAnalytics() || current.state.lastRoute === routeKey) return;
    const location = analyticsLocation(current.browser.location.href);
    if (!location) return;
    const parameters = {
        page_title: current.browser.document.title,
        page_location: location,
        page_referrer: current.state.previousLocation || analyticsLink(current.browser.document.referrer) || "",
        site_language: (current.browser.location.pathname.match(/^\/(ar|en|tr|fr)(?:\/|$)/)?.[1]
            || current.browser.document.documentElement.lang).toUpperCase(),
    };
    current.browser.gtag?.("set", parameters);
    trackAnalyticsEvent("page_view", parameters);
    current.state.lastRoute = routeKey;
    current.state.previousLocation = analyticsLink(location);
}

export function trackLanguageSelection(previous: string, selected: string, source: "kit" | "site_header") {
    if (previous === selected) return;
    trackAnalyticsEvent("language_select", { previous_language: previous.toUpperCase(), selected_language: selected.toUpperCase(), selection_location: source });
}

export function trackFileDownload(href: string, parameters: Record<string, string | number> = {}) {
    const url = analyticsLink(href);
    if (!url) return;
    let pathname;
    try { pathname = decodeURIComponent(new URL(url).pathname); } catch { return; }
    const extension = pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
    if (!extension || !["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip"].includes(extension)) return;
    trackAnalyticsEvent("file_download", { ...parameters, link_url: url, file_name: pathname.split("/").pop() || "", file_extension: extension });
}

export function trackKitResourceClick(resource: KitResource, href: string, locale: KitLocale, title: string) {
    const linkUrl = analyticsLink(href);
    const parameters = { link_id: resource.id, link_text: title.slice(0, 100), site_language: locale.toUpperCase(), ...(linkUrl ? { link_url: linkUrl } : {}) };
    trackAnalyticsEvent("kit_link_click", parameters);
    trackFileDownload(href, { link_id: resource.id, site_language: locale.toUpperCase() });
    if (resource.id === "video") trackAnalyticsEvent("promotional_video_click", parameters);
}

