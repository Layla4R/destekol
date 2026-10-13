import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireRoutePermission, accessErrorResponse } from "@/lib/admin-access";
import { parseKitResources } from "@/lib/kit-config";
import { readKitSettings, saveKitSettings } from "@/lib/kit-settings";

export async function GET(req: Request) {
    try { await requireRoutePermission(req); }
    catch (error) { return accessErrorResponse(error); }
    try {
        return NextResponse.json(await readKitSettings(), { headers: { "Cache-Control": "no-store" } });
    } catch {
        return NextResponse.json({ error: "تعذر تحميل الروابط من قاعدة البيانات. أعد المحاولة." }, { status: 503 });
    }
}

export async function PATCH(req: Request) {
    try { await requireRoutePermission(req); }
    catch (error) { return accessErrorResponse(error); }
    let resources;
    try {
        const body = await req.json();
        resources = parseKitResources(body?.resources);
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "بيانات غير صالحة." }, { status: 400 });
    }
    try {
        const settings = await saveKitSettings(resources);
        revalidatePath("/kit");
        return NextResponse.json(settings, { headers: { "Cache-Control": "no-store" } });
    } catch {
        return NextResponse.json({ error: "تعذر حفظ الروابط. لم يتم تأكيد الحفظ؛ أعد المحاولة." }, { status: 503 });
    }
}
