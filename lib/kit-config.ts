import type { Locale } from "@/lib/locales";

export const KIT_URL = "https://destekol.org/kit";
export const KIT_LOCALES = ["en", "tr", "ar"] as const satisfies readonly Locale[];
export type KitLocale = (typeof KIT_LOCALES)[number];
export const LANGUAGE_COOKIE = "NEXT_LOCALE";

export function getKitLocale(value?: string): KitLocale {
    return KIT_LOCALES.includes(value as KitLocale) ? value as KitLocale : "en";
}

export type KitLinkId = "visits" | "brochure" | "portfolio" | "sustainability" | "video" | "partnerships" | "contact";
export type KitResource = {
    id: KitLinkId | `custom-${string}`;
    tone: "blue" | "green" | "gold";
    icon?: KitLinkId | "link";
    titles?: Partial<Record<KitLocale, string>>;
    enabled?: boolean;
    // Set a shared URL, language-specific URLs, or both. Null means coming soon.
    url: string | null;
    localizedUrls?: Partial<Record<KitLocale, string | null>>;
};

// Only verified resources belong here. Keep this order in every language.
export const KIT_RESOURCES: readonly KitResource[] = [
    { id: "brochure", tone: "blue", url: null },
    { id: "portfolio", tone: "green", url: null },
    { id: "sustainability", tone: "green", url: null },
    { id: "video", tone: "gold", url: null },
    { id: "partnerships", tone: "blue", url: null },
    { id: "contact", tone: "gold", url: null, localizedUrls: {
        en: "/en/contact", tr: "/tr/contact", ar: "/ar/contact",
    } },
];

export function getKitResourceUrl(resource: KitResource, locale: KitLocale): string | null {
    if (resource.enabled === false) return null;
    const url = resource.localizedUrls?.[locale] === undefined
        ? resource.url : resource.localizedUrls[locale];
    if (!url) return null;
    // Reject unsafe schemes, protocol-relative links, and malformed URLs.
    if (/^\/(?!\/)/.test(url) && !/[\\\s]/.test(url)) return url;
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed.href : null;
    } catch {
        return null;
    }
}

export const KIT_SETTINGS_ID = "destekol-kit-links";
export const KIT_MAX_RESOURCES = 40;

export function kitResourceOpensNewTab(resource: KitResource, href: string): boolean {
    return resource.id === "contact" || href.startsWith("https://");
}

/** Validate a complete admin edit before writing anything to the CMS. */
export function parseKitResources(value: unknown): KitResource[] {
    if (!Array.isArray(value) || value.length > KIT_MAX_RESOURCES) {
        throw new Error("بيانات الروابط غير صالحة. الحد الأقصى 40 رابطًا.");
    }
    // The old visit-kit card is now the page heading. Preserve all other saved URLs.
    const rows = value.filter(row => row?.id !== "visits");
    const coreIds = KIT_RESOURCES.map(resource => resource.id);
    let lastCoreIndex = -1;
    let customStarted = false;
    const ids = new Set<string>();
    function checkedUrl(raw: unknown): string | null {
        if (raw === null || raw === undefined || raw === "") return null;
        if (typeof raw !== "string" || raw.length > 2048) throw new Error("الرابط غير صالح أو طويل جدًا.");
        const url = raw.trim();
        if (!url) return null;
        if (!getKitResourceUrl({ id: "visits", tone: "blue", url }, "en")) {
            throw new Error("استخدم رابط HTTPS كاملًا أو مسارًا داخل الموقع يبدأ بـ /.");
        }
        return url;
    }
    return rows.map(raw => {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("بيانات الرابط غير صالحة.");
        const row = raw as Record<string, unknown>;
        const id = row.id;
        const coreIndex = coreIds.indexOf(id as KitResource["id"]);
        const custom = typeof id === "string" && /^custom-[a-z0-9-]{1,60}$/.test(id);
        if (typeof id !== "string" || ids.has(id) || (coreIndex < 0 && !custom)
            || (coreIndex >= 0 && (customStarted || coreIndex <= lastCoreIndex))) {
            throw new Error("ترتيب أو معرفات الروابط غير صالحة.");
        }
        ids.add(id);
        if (custom) customStarted = true;
        else lastCoreIndex = coreIndex;
        if (!["blue", "green", "gold"].includes(String(row.tone))) throw new Error("لون الرابط غير صالح.");
        if (row.enabled !== undefined && typeof row.enabled !== "boolean") throw new Error("حالة الرابط غير صالحة.");
        if (row.icon !== undefined && !["visits", ...KIT_RESOURCES.map(item => item.id), "link"].includes(row.icon as KitLinkId)) {
            throw new Error("أيقونة الرابط غير صالحة.");
        }
        const localizedUrls: Partial<Record<KitLocale, string | null>> = {};
        const titles: Partial<Record<KitLocale, string>> = {};
        for (const key of ["localizedUrls", "titles"] as const) {
            if (row[key] !== undefined && (!row[key] || typeof row[key] !== "object" || Array.isArray(row[key]))) {
                throw new Error("بيانات اللغات غير صالحة.");
            }
        }
        for (const language of KIT_LOCALES) {
            const localized = (row.localizedUrls as Record<string, unknown> | undefined)?.[language];
            if (localized !== undefined) localizedUrls[language] = checkedUrl(localized);
            const title = (row.titles as Record<string, unknown> | undefined)?.[language];
            if (title !== undefined) {
                if (typeof title !== "string" || title.length > 160) throw new Error("العنوان يجب أن يكون نصًا لا يتجاوز 160 حرفًا.");
                if (title.trim()) titles[language] = title.trim();
            }
        }
        if (custom && !titles.en) throw new Error("أضف عنوانًا إنجليزيًا للرابط الجديد؛ يمكن إضافة باقي اللغات أيضًا.");
        return {
            id: id as KitResource["id"], tone: row.tone as KitResource["tone"],
            icon: row.icon as KitResource["icon"], enabled: row.enabled !== false,
            url: checkedUrl(row.url), localizedUrls, titles,
        };
    });
}
