export const CONSENT_KEY = 'destekol_cookie_consent';
export const CONSENT_EVENT = 'destekol:cookie-consent';
export type CookieConsent = { version: 2; updatedAt: string; analytics: boolean; marketing: boolean; functional: boolean };
export function parseConsent(value: string | null): CookieConsent | null {
    try {
        const data = JSON.parse(value || 'null');
        return data?.version === 2 && typeof data.analytics === 'boolean' && typeof data.marketing === 'boolean' && typeof data.functional === 'boolean' && typeof data.updatedAt === 'string' ? data : null;
    } catch { return null; }
}
export function readConsent() {
    try { return parseConsent(localStorage.getItem(CONSENT_KEY)); } catch { return null; }
}
export function trackingAllowed(consent: CookieConsent | null, provider: 'ga' | 'gtm' | 'meta') {
    return provider === 'gtm' ? !!consent?.analytics && !!consent?.marketing : provider === 'ga' ? !!consent?.analytics : !!consent?.marketing;
}
export function clearTrackingCookies() {
    document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (!/^(_ga|_gid|_gat|_fbp|_fbc)/.test(name)) return;
        const domains = ['', location.hostname, `.${location.hostname}`];
        const labels = location.hostname.split('.');
        if (labels.length > 2) domains.push(`.${labels.slice(-2).join('.')}`);
        for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/;${domain ? ` domain=${domain};` : ''}`;
    });
}
