import { adminFetch } from "@/lib/admin-fetch";
import { planTranslation } from "@/lib/translation-content";
export async function autoTranslateContent<T>(source: T, targetLang: string, progress?: (done: number, total: number) => void): Promise<T> {
    const plan = planTranslation(source);
    const translated: string[] = [];
    for (let start = 0; start < plan.texts.length; start += 6) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 55000);
        try {
            const response = await adminFetch("/api/admin/translate", {
                method: "POST", signal: controller.signal,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sections: plan.texts.slice(start, start + 6), targetLang }),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || "فشلت الترجمة؛ أعد المحاولة.");
            if (!Array.isArray(data.sections) || data.sections.length !== Math.min(6, plan.texts.length - start)
                || data.sections.some((v: unknown) => typeof v !== "string" || !v.trim())) {
                throw new Error("استجابة الترجمة غير مكتملة.");
            }
            translated.push(...data.sections);
            progress?.(translated.length, plan.texts.length);
        }
        finally {
            clearTimeout(timer);
        }
    }
    return plan.apply(translated) as T;
}
