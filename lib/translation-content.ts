const TEXT_KEYS = new Set([
    "title", "subtitle", "heading", "subheading", "eyebrow", "description", "desc",
    "summary", "excerpt", "body", "body2", "body3", "text", "content", "quote",
    "caption", "alt", "imageAlt", "cartButtonText", "buttonText", "buttonLabel", "headline", "label", "question", "answer", "name", "location", "category", "status", "value", "badgeText", "placeholder",
    "storyEyebrow", "readButtonText", "successText", "errorText", "notice", "authorName", "authorRole", "contactHeading", "contactSummary",
]);
const arabic = /[\u0621-\u064A\u066E-\u06D3]/;
// Translate editorial text only; preserve IDs, layout, images, links and markup.
export function planTranslation(input: unknown) {
    const texts: string[] = [];
    const indexes = new Map<string, number>();
    function textPlan(text: string): (values: string[]) => string {
        if (/^(?:https?:|mailto:|tel:|data:|\/|#)/i.test(text.trim()) && !text.trim().includes(" "))
            return () => text;
        const parts = text.split(/(<[^>]*>|https?:\/\/[^\s<>]+|\r?\n+)/g).filter(Boolean);
        const builders = parts.map(part => {
            if (/^(<|https?:\/\/|\r?\n)/.test(part) || !arabic.test(part))
                return () => part;
            const chunks: Array<(values: string[]) => string> = [];
            let rest = part;
            while (rest.length) {
                let end = Math.min(700, rest.length);
                if (end < rest.length) {
                    const space = rest.lastIndexOf(" ", end - 1);
                    if (space > 0)
                        end = space + 1;
                }
                const chunk = rest.slice(0, end);
                rest = rest.slice(end);
                const core = chunk.trim();
                if (!arabic.test(core)) {
                    chunks.push(() => chunk);
                    continue;
                }
                if (!indexes.has(core)) {
                    indexes.set(core, texts.length);
                    texts.push(core);
                }
                const index = indexes.get(core)!;
                const leading = chunk.match(/^\s*/)?.[0] || "";
                const trailing = chunk.match(/\s*$/)?.[0] || "";
                chunks.push(values => leading + values[index] + trailing);
            }
            return (values: string[]) => chunks.map(build => build(values)).join("");
        });
        return values => builders.map(build => build(values)).join("");
    }
    function walk(value: any, translate = false): (values: string[]) => any {
        if (typeof value === "string")
            return translate ? textPlan(value) : () => value;
        if (Array.isArray(value)) {
            const children = value.map(item => walk(item, translate));
            return values => children.map(build => build(values));
        }
        if (!value || typeof value !== "object")
            return () => value;
        const children = Object.entries(value).map(([key, original]) => {
            const base = key.replace(/_(ar|en|fr|tr)$/, "");
            // Legacy blocks read *_en in all non-Arabic locales. Always use the Arabic source.
            const source = /_(en|fr|tr)$/.test(key) && typeof value[base + "_ar"] === "string"
                ? value[base + "_ar"] : original;
            return { key, build: walk(source, TEXT_KEYS.has(base)) };
        });
        return values => Object.fromEntries(children.map(({ key, build }) => [key, build(values)]));
    }
    const build = walk(input, true);
    return { texts, apply(values: string[]) {
            if (values.length !== texts.length || values.some(v => typeof v !== "string" || !v.trim())) {
                throw new Error("استجابة الترجمة غير مكتملة؛ لم يتم استبدال المحتوى.");
            }
            return build(values);
        } };
}
