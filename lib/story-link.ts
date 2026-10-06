/** Resolve an admin-entered story destination without inventing a donation page. */
export function storyLink(value: unknown, locale: string): string | null {
    if (typeof value !== "string")
        return null;
    const url = value.trim();
    if (!url || /[\u0000-\u0020\\]/.test(url) || url.startsWith("//"))
        return null;
    if (/^https?:\/\//i.test(url)) {
        try {
            return new URL(url).href;
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
    if (/^\/(ar|en|fr|tr)(\/|\?|#|$)/.test(path))
        return path;
    return locale === "ar" ? path : `/${locale}${path}`;
}
