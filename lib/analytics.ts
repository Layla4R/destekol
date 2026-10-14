import type { CookieConsent } from "@/lib/cookie-consent";
import type { KitLinkId, KitLocale, KitResource } from "@/lib/kit-config";

export const GA_MEASUREMENT_ID = "G-KREW1XWX0X";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"];
const KIT_ANALYTICS_NAMES: Record<KitLinkId, string> = {
    website: "official_website", brochure: "brochure", portfolio: "portfolio",
    sustainability: "sustainability_report", video: "promotional_video",
    partnerships: "partnership", contact: "contact",
};
// These saved admin records were repurposed without changing their persistent IDs.
// Keep reporting names tied to record identity, independent of URLs, titles or order.
const SAVED_KIT_ANALYTICS_NAMES: Record<string, string> = {
    brochure: "official_website",
    "custom-e52da41f-1a6a-4472-9227-d1389735cae0": "brochure",
};
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

/** Public pages send cookieless signals immediately; private pages stay excluded. */
export function analyticsEnabled(pathname: string): boolean {
    return isAnalyticsPage(pathname);
}

function analyticsStorageGranted(
  pathname: string,
  consent: CookieConsent | null
): boolean {
  return analyticsEnabled(pathname)
    && consent?.analytics === true;
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
    const enabled = analyticsEnabled(browser.location.pathname);
    const granted = analyticsStorageGranted(browser.location.pathname, consent);
    browser[`ga-disable-${GA_MEASUREMENT_ID}`] = !enabled;
    // if (!granted) {
    //     state.granted = false;
    //     browser.gtag?.("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    // }
    // if (!enabled) {
    //     state.lastRoute = null;
    //     if (browser.dataLayer) {
    //         const kept = browser.dataLayer.filter(entry => (entry as ArrayLike<unknown>)?.[0] !== "event");
    //         browser.dataLayer.splice(0, browser.dataLayer.length, ...kept);
    //     }
    // }
}

export function initializeAnalytics(): boolean {
    const current = runtime();
    if (!current || !analyticsEnabled(current.browser.location.pathname)) return false;
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

export function trackAnalyticsEvent(name: string, parameters: Record<string, string | number | boolean>, onComplete?: () => void): boolean {
    const current = runtime();
    if (!current || !analyticsEnabled(current.browser.location.pathname)
        || !current.state.configured) return false;
    const payload = {
        ...parameters, send_to: GA_MEASUREMENT_ID,
        page_location: analyticsLocation(current.browser.location.href),
        ...(onComplete ? { event_callback: onComplete, event_timeout: 800 } : {}),
        ...(current.state.debug ? { debug_mode: true } : {}),
    };
    current.browser.gtag?.("event", name, payload);
    if (current.state.debug && process.env.NODE_ENV === "development") console.debug("[Destekol GA4]", name, JSON.stringify(payload));
    return true;
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
    trackAnalyticsEvent("language_select", {
        previous_language: previous.toUpperCase(), selected_language: selected.toUpperCase(), selection_location: source,
        ...(source === "kit" ? { kit_language: selected.toLowerCase() } : {}),
    });
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

/** Record public navigation without collecting link labels or arbitrary query values. */
export function trackWebsiteLinkClick(href: string) {
    const current = runtime();
    const url = analyticsLink(href);
    if (!current || !url) return;
    trackAnalyticsEvent("site_link_click", {
        link_url: url,
        link_type: new URL(url).origin === current.browser.location.origin ? "internal" : "outbound",
        site_language: (current.browser.location.pathname.match(/^\/(ar|en|tr|fr)(?:\/|$)/)?.[1]
            || current.browser.document.documentElement.lang).toUpperCase(),
    });
}

export function trackKitResourceClick(resource: KitResource, href: string, locale: KitLocale, onComplete?: () => void): boolean {
    // Ignore obsolete resources supplied by an old cached page after deployment.
    if ((resource.id as string) === "visits") return false;
    const linkUrl = analyticsLink(href);
    if (!linkUrl) return false;
    const parameters = {
        kit_link_name: SAVED_KIT_ANALYTICS_NAMES[resource.id]
            || KIT_ANALYTICS_NAMES[resource.id as KitLinkId] || resource.id,
        kit_language: locale,
        link_id: resource.id, site_language: locale.toUpperCase(), link_url: linkUrl,
    };
    const queued = trackAnalyticsEvent("kit_link_click", parameters, onComplete);
    trackFileDownload(href, { link_id: resource.id, site_language: locale.toUpperCase(), kit_link_name: parameters.kit_link_name, kit_language: locale });
    if (resource.id === "video") trackAnalyticsEvent("promotional_video_click", parameters);
    return queued;
}

