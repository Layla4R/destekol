import { requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req: Request) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = getSupabase();
    // Get pages + their translation status in parallel (not N×3 requests)
    const [pagesRes, transRes] = await Promise.all([
        supabase.from("Page").select("id,slug,title,description,isPublished,showInMenu,isSystem,order,updatedAt,sections").order("order", { ascending: true }).order("createdAt", { ascending: true }),
        supabase.from("PageTranslation").select("pageId, locale").in("locale", ["en", "fr", "tr"]),
    ]);
    if (pagesRes.error) {
        if (process.env.NODE_ENV !== "production")
            console.error("Pages fetch error:", pagesRes.error);
        return NextResponse.json({ error: "Failed to fetch pages: " + pagesRes.error.message }, { status: 500 });
    }
    const pages = (pagesRes.data || []).map(p => ({
        ...p,
        // Only pass sections count, not full sections array (saves bandwidth)
        sectionsCount: Array.isArray(p.sections) ? p.sections.length : 0,
        sections: undefined,
    }));
    // Build translation map: { pageId: { en: true, fr: false, tr: true } }
    const transMap: Record<string, Record<string, boolean>> = {};
    for (const t of transRes.data || []) {
        if (!transMap[t.pageId])
            transMap[t.pageId] = {};
        transMap[t.pageId][t.locale] = true;
    }
    return NextResponse.json({ pages, transMap });
}
export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { title, slug, description } = body;
    if (!title || !slug) {
        return NextResponse.json({ error: "Title and slug are required." }, { status: 400 });
    }
    const cleanSlug = String(slug).trim().toLowerCase()
        .replace(/\s+/g, "-").replace(/[^a-z0-9\-_]/g, "").replace(/-+/g, "-");
    if (!cleanSlug) {
        return NextResponse.json({ error: "Invalid slug — use lowercase letters, numbers, and hyphens only." }, { status: 400 });
    }
    const supabase = getSupabase();
    const { data: existing } = await supabase.from("Page").select("id").eq("slug", cleanSlug).maybeSingle();
    if (existing) {
        return NextResponse.json({ error: `A page with slug "/${cleanSlug}" already exists.` }, { status: 400 });
    }
    const { data: maxRow } = await supabase.from("Page").select("order")
        .order("order", { ascending: false }).limit(1).maybeSingle();
    const nextOrder = (maxRow?.order ?? -1) + 1;
    const { data: page, error } = await supabase.from("Page").insert({
        title, slug: cleanSlug,
        description: description || null,
        sections: [], order: nextOrder, isPublished: false,
    }).select("*").single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ page });
}
// PATCH /api/admin/pages — bulk reorder
export async function PATCH(req: NextRequest) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { orders } = await req.json(); // [{ id, order }]
    if (!Array.isArray(orders))
        return NextResponse.json({ error: "orders must be an array" }, { status: 400 });
    const supabase = getSupabase();
    await Promise.all(orders.map(({ id, order }: {
        id: string;
        order: number;
    }) => supabase.from("Page").update({ order }).eq("id", id)));
    return NextResponse.json({ ok: true });
}
