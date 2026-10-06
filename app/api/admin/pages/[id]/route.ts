import { requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mergeCmsTranslation } from "@/lib/cms-localization";
export async function GET(req: NextRequest, { params }: {
    params: {
        id: string;
    };
}) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = getSupabase();
    const { data: page, error } = await supabase.from("Page").select("*").eq("id", params.id).maybeSingle();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    if (!page)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ page });
}
export async function PATCH(req: NextRequest, { params }: {
    params: {
        id: string;
    };
}) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const data: any = {};
    if (body.title !== undefined)
        data.title = body.title;
    if (body.description !== undefined)
        data.description = body.description;
    if (body.sections !== undefined) {
        data.sections = Array.isArray(body.sections) ? body.sections : [];
    }
    if (body.isPublished !== undefined)
        data.isPublished = body.isPublished;
    if (body.showInMenu !== undefined)
        data.showInMenu = body.showInMenu;
    if (body.order !== undefined)
        data.order = body.order;
    // 🌟 استلام وحفظ حقول التقرير الصحفي والإعلامي المتقدم للمشاريع
    if (body.body !== undefined)
        data.body = body.body;
    if (body.body2 !== undefined)
        data.body2 = body.body2;
    if (body.body3 !== undefined)
        data.body3 = body.body3;
    if (body.coverImage !== undefined)
        data.coverImage = body.coverImage;
    if (body.secondaryImage !== undefined)
        data.secondaryImage = body.secondaryImage;
    if (body.gallery !== undefined)
        data.gallery = Array.isArray(body.gallery) ? body.gallery : [];
    if (body.videoUrl !== undefined)
        data.videoUrl = body.videoUrl;
    const supabase = getSupabase();
    if (body.slug !== undefined) {
        const cleanSlug = String(body.slug)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9\-_]/g, "");
        if (!cleanSlug) {
            return NextResponse.json({ error: "Invalid slug — use lowercase letters, numbers, and hyphens only." }, { status: 400 });
        }
        const { data: existing } = await supabase.from("Page").select("id").eq("slug", cleanSlug).maybeSingle();
        if (existing && existing.id !== params.id) {
            return NextResponse.json({ error: `A page with slug "/${cleanSlug}" already exists.` }, { status: 400 });
        }
        data.slug = cleanSlug;
    }
    data.updatedAt = new Date().toISOString();
    const { data: page, error } = await supabase.from("Page").update(data).eq("id", params.id).select("*").single();
    if (error) {
        if (process.env.NODE_ENV !== "production")
            console.error("[pages PATCH] DB error:", error);
        return NextResponse.json({ error: error.message, details: error.details || undefined }, { status: 500 });
    }
    if (data.sections !== undefined) {
        const { data: translations, error: readError } = await supabase.from("PageTranslation").select("id,sections").eq("pageId", params.id);
        if (readError) return NextResponse.json({ error: "Page saved; translation synchronization failed. Please retry." }, { status: 500 });
        for (const translation of translations || []) {
            const { error: syncError } = await supabase.from("PageTranslation").update({
                sections: mergeCmsTranslation(page.sections || [], translation.sections),
                updatedAt: page.updatedAt,
            }).eq("id", translation.id);
            if (syncError) return NextResponse.json({ error: "Page saved; translation synchronization failed. Please retry." }, { status: 500 });
        }
    }
    revalidatePath("/", "layout");
    return NextResponse.json({ page });
}
export async function DELETE(req: NextRequest, { params }: {
    params: {
        id: string;
    };
}) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = getSupabase();
    const { data: page } = await supabase.from("Page").select("isSystem").eq("id", params.id).maybeSingle();
    if (!page)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (page.isSystem) {
        return NextResponse.json({ error: "System pages cannot be deleted." }, { status: 400 });
    }
    const { error } = await supabase.from("Page").delete().eq("id", params.id);
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
