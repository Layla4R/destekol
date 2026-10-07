import { requireRoutePermission, accessErrorResponse } from "@/lib/admin-access";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { applyCmsSharedEdits, mergeCmsTranslation } from "@/lib/cms-localization";
// GET /api/admin/pages/translations?pageId=xxx&locale=en
export async function GET(req: NextRequest) {
    try {
        await requireRoutePermission(req);
    }
    catch(error) { return accessErrorResponse(error); }
    const url = new URL(req.url);
    const pageId = url.searchParams.get("pageId");
    const locale = url.searchParams.get("locale");
    if (!pageId || !locale)
        return NextResponse.json({ error: "Missing pageId or locale" }, { status: 400 });
    const supabase = getSupabase();
    const { data } = await supabase.from("PageTranslation").select("*").eq("pageId", pageId).eq("locale", locale).maybeSingle();
    return NextResponse.json({ translation: data || null });
}
// POST/PATCH — upsert a page translation
export async function POST(req: NextRequest) {
    try {
        await requireRoutePermission(req);
    }
    catch(error) { return accessErrorResponse(error); }
    const { pageId, locale, title, description, sections, ...extra } = await req.json();
    if (!pageId || !["en", "fr", "tr"].includes(locale) || !title)
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    const supabase = getSupabase();
    const media: Record<string, unknown> = {};
    for (const key of ["body", "body2", "body3", "coverImage", "secondaryImage", "videoUrl"]) {
        if (extra[key] !== undefined) {
            if (typeof extra[key] !== "string" && extra[key] !== null)
                return NextResponse.json({ error: "Invalid " + key }, { status: 400 });
            media[key] = extra[key];
        }
    }
    if (extra.gallery !== undefined) {
        if (!Array.isArray(extra.gallery) || extra.gallery.some((v: unknown) => typeof v !== "string"))
            return NextResponse.json({ error: "Invalid gallery" }, { status: 400 });
        media.gallery = extra.gallery;
    }
    const { data: page } = await supabase.from("Page").select("id,sections").eq("id", pageId).maybeSingle();
    if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
    const { data: previous } = await supabase.from("PageTranslation").select("sections").eq("pageId", pageId).eq("locale", locale).maybeSingle();
    const canonical = applyCmsSharedEdits(page.sections || [], previous?.sections || page.sections || [], sections);
    if (JSON.stringify(canonical) !== JSON.stringify(page.sections)) {
        const { error: pageError } = await supabase.from("Page").update({ sections: canonical, updatedAt: new Date().toISOString() }).eq("id", pageId);
        if (pageError) return NextResponse.json({ error: "Unable to save shared page data" }, { status: 500 });
        const { data: siblings } = await supabase.from("PageTranslation").select("id,sections").eq("pageId", pageId);
        for (const sibling of siblings || []) {
            const { error: siblingError } = await supabase.from("PageTranslation").update({ sections: mergeCmsTranslation(canonical, sibling.sections), updatedAt: new Date().toISOString() }).eq("id", sibling.id);
            if (siblingError) return NextResponse.json({ error: "Shared data saved; translation synchronization failed. Retry saving." }, { status: 500 });
        }
    }
    const { data, error } = await supabase.from("PageTranslation").upsert({ ...media, pageId, locale, title, description: description || null, sections: mergeCmsTranslation(canonical, sections || []), updatedAt: new Date().toISOString() }, { onConflict: "pageId,locale" }).select("*").single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/", "layout");
    return NextResponse.json({ translation: data });
}
export async function DELETE(req: NextRequest) {
    try {
        await requireRoutePermission(req);
    }
    catch(error) { return accessErrorResponse(error); }
    const { pageId, locale } = await req.json();
    const supabase = getSupabase();
    await supabase.from("PageTranslation").delete().eq("pageId", pageId).eq("locale", locale);
    return NextResponse.json({ ok: true });
}
