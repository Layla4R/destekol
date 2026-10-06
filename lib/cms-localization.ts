const TEXT_FIELDS = new Set([
    "title", "subtitle", "heading", "subheading", "headline", "description", "desc",
    "summary", "excerpt", "body", "body2", "body3", "content", "text", "quote",
    "caption", "alt", "imageAlt", "label", "name", "question", "answer", "eyebrow",
    "buttonText", "buttonLabel", "cartButtonText", "badgeText", "placeholder",
    "storyEyebrow", "readButtonText", "successText", "errorText", "notice",
    "category", "location", "status", "authorName", "authorRole", "contactHeading", "contactSummary",
]);
function keyOf(value: unknown): string | undefined {
    if (!value || typeof value !== "object") return undefined;
    const row = value as Record<string, unknown>;
    for (const key of ["id", "campaignId", "slug", "icon"]) {
        if (typeof row[key] === "string" && row[key]) return `${key}:${row[key]}`;
    }
    return undefined;
}
/** Base CMS data owns facts, media, links and structure; translations own wording. */
export function mergeCmsTranslation<T>(base: T, translated: unknown, field = ""): T {
    if (Array.isArray(base)) {
        const rows = Array.isArray(translated) ? translated : [];
        return base.map((item, index) => {
            const key = keyOf(item);
            const matching = key ? rows.find(row => keyOf(row) === key) : rows[index];
            return mergeCmsTranslation(item, matching);
        }) as T;
    }
    if (base && typeof base === "object" && Object.getPrototypeOf(base) === Object.prototype) {
        let row = translated && typeof translated === "object" ? translated as Record<string, unknown> : {};
        const original = base as Record<string, unknown>;
        if (original.type && row.type && original.type !== row.type) row = {};
        return Object.fromEntries(Object.entries(base as Record<string, unknown>).map(([key, value]) => [
            key, mergeCmsTranslation(value, row[key], key),
        ])) as T;
    }
    const key = field.replace(/_(ar|en|fr|tr)$/, "");
    if (typeof base === "string" && TEXT_FIELDS.has(key) && typeof translated === "string" && translated.trim()) {
        return translated as T;
    }
    return base;
}

/** Only deliberate edits to shared fields propagate from a translated editor. */
export function applyCmsSharedEdits<T>(base: T, previous: unknown, submitted: unknown, field = ""): T {
    if (["id", "type", "slug", "pageId", "campaignId"].includes(field) || TEXT_FIELDS.has(field.replace(/_(ar|en|fr|tr)$/, ""))) return base;
    if (Array.isArray(base)) {
        const oldRows = Array.isArray(previous) ? previous : [];
        const newRows = Array.isArray(submitted) ? submitted : [];
        return base.map((item, index) => {
            const key = keyOf(item);
            const oldItem = key ? oldRows.find(row => keyOf(row) === key) : oldRows[index];
            const newItem = key ? newRows.find(row => keyOf(row) === key) : newRows[index];
            return applyCmsSharedEdits(item, oldItem, newItem);
        }) as T;
    }
    if (base && typeof base === "object" && Object.getPrototypeOf(base) === Object.prototype) {
        const oldRow = previous && typeof previous === "object" ? previous as Record<string, unknown> : {};
        const newRow = submitted && typeof submitted === "object" ? submitted as Record<string, unknown> : {};
        return Object.fromEntries(Object.entries(base as Record<string, unknown>).map(([key, value]) => [key,
            applyCmsSharedEdits(value, oldRow[key], newRow[key], key),
        ])) as T;
    }
    return submitted !== undefined && JSON.stringify(previous) !== JSON.stringify(submitted) ? submitted as T : base;
}
