const DESTEKOL_ORGANIZATION_NAMES: Record<string, string> = {
    ar: "جمعية Destekol الخيرية غير الربحية",
    en: "Destekol Charitable Non-Profit Association",
    fr: "Association caritative Destekol à but non lucratif",
    tr: "Destekol kâr amacı gütmeyen hayır derneği",
};
export function getDestekolOrganizationName(locale = "en"): string {
    return DESTEKOL_ORGANIZATION_NAMES[locale] || DESTEKOL_ORGANIZATION_NAMES.en;
}
/**
 * Render imported editorial content with this association's localized identity.
 * Stored customer and account records are never passed through this function.
 */
export function normalizeDestekolBrandText(value: string, locale = "en"): string {
    // Normalize historical CMS labels and links before serializing public content.
    // This is an import compatibility rule, with no dependency on another application.
    value = value
        .replace(/(https?:\/\/(?:www\.)?|mailto:|@)(?:4|for)relief\.org/gi, "$1destekol.org")
        .replace(/\b(?:4|For)\s*Relief\b/gi, "Destekol");
    // Leave navigational targets and contact details intact while changing copy.
    if (/^(?:https?:\/\/|\/|mailto:|tel:)/i.test(value.trim()))
        return value;
    const protectedValues: string[] = [];
    const text = value.replace(/https?:\/\/[^\s"'<>]+|(?:href|src)=["'][^"']*["']/gi, (match) => {
        const index = protectedValues.push(match) - 1;
        return `__DESTEKOL_PROTECTED_${index}__`;
    });
    const organizationName = getDestekolOrganizationName(locale);
    return text
        .replace(/(?:Destekol|For\s+Relief|Destekol)\s+is\s+an?\s+independent\s+humanitarian\s+and\s+development\s+(?:organization|organisation|foundation)\b/gi, "Destekol is a charitable non-profit association")
        .replace(/(?:مؤسسة|منظمة)\s*(?:Destekol|For\s+Relief|Destekol|Destek\s+ol\s+non\s+profit\s+NGO|فور\s*ريليف)(?:\s+(?:Humanitarian\s+Foundation|الإنسانية))?(?:\s*\(\s*Destekol\s*\))?/gi, organizationName)
        .replace(/For\s+Relief\s+Humanitarian\s+Foundation\s*\(\s*Destekol\s*\)/gi, organizationName)
        .replace(/(?:Destekol|For\s+Relief)\s+Humanitarian\s+Foundation/gi, organizationName)
        .replace(/Fondation\s+Humanitaire\s+(?:Destekol|Destekol)/gi, organizationName)
        .replace(/(?:Destekol|Destekol)\s+(?:İnsani|Insani)\s+Yardım\s+Vakfı/gi, organizationName)
        .replace(/(?:Destekol|Destekol)\s+International\s+Humanitarian\s+Foundation/gi, organizationName)
        .replace(/International\s+Humanitarian\s+Foundation/gi, locale === "en" ? "Charitable Non-Profit Association" : organizationName)
        .replace(/Fondation\s+Humanitaire\s+Internationale/gi, locale === "fr" ? "Association caritative à but non lucratif" : organizationName)
        .replace(/Uluslararası\s+İnsani\s+Yardım\s+Vakfı/gi, locale === "tr" ? "Kâr amacı gütmeyen hayır derneği" : organizationName)
        .replace(/منظمة\s+إغاثة\s+وإنسانية\s+دولية/gi, locale === "ar" ? "جمعية خيرية إنسانية" : organizationName)
        .replace(/مؤسسة\s+مستقلة/gi, locale === "ar" ? "جمعية خيرية مستقلة" : organizationName)
        .replace(/مؤسسة\s+إنسانية\s+وتنموية\s+مستقلة/gi, locale === "ar" ? "جمعية إنسانية وتنموية مستقلة" : organizationName)
        .replace(/منظمة\s+إنسانية\s+مسجلة\s+ومستقلة/gi, locale === "ar" ? "جمعية Destekol الخيرية المسجلة والمستقلة" : organizationName)
        .replace(/(جمعية\s+Destekol(?:\s+الخيرية)?(?:\s+غير\s+الربحية)?)\s+مؤسسة\b/gi, "$1 جمعية")
        .replace(/Destekol\s+is\s+(?:an?\s+)?(?:independent\s+)?(?:humanitarian\s+)?(?:non-profit\s+)?(?:foundation|organization|organisation|NGO)\b/gi, "Destekol is a charitable non-profit association")
        .replace(/independent\s+humanitarian\s+and\s+development\s+(?:organization|organisation|foundation)/gi, "charitable non-profit association working in humanitarian and development fields")
        .replace(/Destekol\s+est\s+(?:une\s+)?(?:organisation|fondation|ONG)\b/gi, "Destekol est une association caritative à but non lucratif")
        .replace(/Destekol\s+(?:bağımsız\s+)?(?:insani\s+)?(?:bir\s+)?(?:vakıf|kuruluş|STK)\b/gi, "Destekol kâr amacı gütmeyen hayır derneğidir")
        .replace(/bağımsız\s+bir\s+insani\s+yardım\s+ve\s+kalkınma\s+kuruluşudur/gi, "bağımsız bir hayır derneğidir")
        .replace(/insani\s+yardım\s+ve\s+kalkınma\s+kuruluşudur/gi, "kâr amacı gütmeyen hayır derneğidir")
        .replace(/Registered\s+Independent\s+NGO/gi, organizationName)
        .replace(/Certified\s*&\s*Licensed\s+NGO/gi, locale === "en" ? "Certified & Licensed Charitable Association" : organizationName)
        .replace(/Kayıtlı\s+Bağımsız\s+STK/gi, locale === "tr" ? "Kayıtlı Destekol hayır derneği" : organizationName)
        .replace(/ONG\s+Indépendante\s+Enregistrée/gi, locale === "fr" ? "Association caritative Destekol enregistrée" : organizationName)
        .replace(/Destekol\s*—\s*For\s+Relief\s+Humanitarian\s+Foundation/gi, organizationName)
        .replace(/Destekol/gi, "Destekol")
        .replace(/For\s+Relief/gi, "Destekol")
        .replace(/فور\s*ريليف/gi, "Destekol")
        .replace(/Destek\s+ol\s+non\s+profit\s+NGO/gi, organizationName)
        .replace(/Destekol\s+Humanitarian\s+Foundation/gi, organizationName)
        .replace(/Fondation\s+Humanitaire\s+Destekol/gi, organizationName)
        .replace(/Destekol\s+(?:İnsani|Insani)\s+Yardım\s+Vakfı/gi, organizationName)
        .replace(/Destekol\s+(?:International\s+)?Humanitarian\s+Foundation/gi, organizationName)
        .replace(/(?:مؤسسة|منظمة)\s+Destekol(?:\s+الإنسانية)?/gi, organizationName)
        .replace(/(?:مؤسسة|منظمة)\s+غير\s+ربحية(?:\s*\(NGO\))?/gi, organizationName)
        .replace(/__DESTEKOL_PROTECTED_(\d+)__/g, (_, index: string) => protectedValues[Number(index)] || "");
}
// These values are identifiers used by renderers, routes and integrations, not copy.
const CONTENT_IDENTIFIERS = new Set([
    "id", "type", "slug", "icon", "category", "categorySlug", "campaignId",
    "pageId", "sectionId", "locale", "language", "currency", "frequency",
]);

export function normalizeDestekolBrandCopy<T>(value: T, locale = "en"): T {
    if (typeof value === "string")
        return normalizeDestekolBrandText(value, locale) as T;
    if (Array.isArray(value))
        return value.map((item) => normalizeDestekolBrandCopy(item, locale)) as T;
    if (value && typeof value === "object" && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
        return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [
            key, CONTENT_IDENTIFIERS.has(key) ? item : normalizeDestekolBrandCopy(item, locale),
        ])) as T;
    }
    return value;
}
