import { requireAdmin } from "@/lib/auth";
import { planTranslation } from "@/lib/translation-content";
import { NextRequest,NextResponse } from "next/server";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
async function translateText(text: string, targetLang: string, signal: AbortSignal): Promise<string> {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            signal.throwIfAborted();
            const url = new URL("https://translate.googleapis.com/translate_a/single");
            url.search = new URLSearchParams({ client: "gtx", sl: "ar", tl: targetLang, dt: "t", q: text }).toString();
            const controller = new AbortController();
            const abort = () => controller.abort();
            signal.addEventListener("abort", abort, { once: true });
            const timer = setTimeout(abort, 6000);
            try {
                const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
                if (!response.ok)
                    throw new Error("Google translation HTTP " + response.status);
                const data: unknown = await response.json();
                if (!Array.isArray(data) || !Array.isArray(data[0]) || !data[0].length
                    || data[0].some((part: unknown) => !Array.isArray(part) || typeof part[0] !== "string"))
                    throw new Error("Invalid translation response");
                const result = data[0].map((part: string[]) => part[0]).join("");
                if (!result.trim() || result.trim() === text.trim() || /[\u0621-\u064A\u066E-\u06D3]/.test(result))
                    throw new Error("Google returned untranslated text");
                return result;
            }
            finally {
                clearTimeout(timer);
                signal.removeEventListener("abort", abort);
            }
        }
        catch (error) {
            if (signal.aborted || attempt === 2)
                throw error;
            await new Promise(resolve => setTimeout(resolve, 400 * 2 ** attempt));
        }
    }
    throw new Error("Translation failed");
}
export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let input;
    try {
        input = await req.json();
    }
    catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (!input || !Array.isArray(input.sections) || !["en", "fr", "tr"].includes(input.targetLang)) {
        return NextResponse.json({ error: "أرسل الأقسام ولغة الهدف en أو fr أو tr." }, { status: 400 });
    }
    if (JSON.stringify(input.sections).length > 100000)
        return NextResponse.json({ error: "المحتوى كبير؛ أرسله على دفعات." }, { status: 413 });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
        const plan = planTranslation(input.sections);
        if (plan.texts.length > 12)
            return NextResponse.json({ error: "يرجى تقسيم الترجمة إلى دفعات أصغر." }, { status: 413 });
        const results: string[] = new Array(plan.texts.length);
        let index = 0;
        await Promise.all(Array.from({ length: Math.min(3, plan.texts.length) }, async () => {
            while (index < plan.texts.length) {
                const current = index++;
                results[current] = await translateText(plan.texts[current], input.targetLang, controller.signal);
            }
        }));
        return NextResponse.json({ sections: plan.apply(results) });
    }
    catch (error) {
        console.error("[auto-translate]", error instanceof Error ? error.message : "Translation failed");
        return NextResponse.json({ error: "تعذّرت ترجمة المحتوى كاملاً من Google. لم يتم استبدال المحتوى؛ أعد المحاولة بعد قليل." }, { status: 502 });
    }
    finally {
        clearTimeout(timer);
        controller.abort();
    }
}
