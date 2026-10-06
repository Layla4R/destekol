/** Resolve an admin-entered story destination without inventing a donation page. */
export function storyLink(value: unknown, locale: string): string | null {
    if (typeof value !== "string")
        return null;
    const url = value.trim();
    if (!url || /[\u0000-\u0020\\]/.test(url) || url.startsWith("//"))
        return null;
    if (/^https?:\/\//i.test(url)) {
        try {
            const parsed = new URL(url);
            if (["destekol.org", "www.destekol.org", "destekol.netlify.app"].includes(parsed.hostname)) {
                parsed.pathname = `/${locale}${parsed.pathname.replace(/^\/(ar|en|fr|tr)(?=\/|$)/, "")}`;
            }
            return parsed.href;
        }
        catch {
            return null;
        }
    }
    if (/^[a-z][a-z\d+.-]*:/i.test(url))
        return null;
    if (url.startsWith("#"))
        return url;
    const path = url.startsWith("/") ? url : `/${url}`;
    const destination = path.replace(/^\/(ar|en|fr|tr)(?=\/|\?|#|$)/, "");
    return `/${locale}${destination}`;
}
