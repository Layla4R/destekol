import { requireAdmin } from "@/lib/auth";
import { getNewsCategories } from "@/lib/news-categories-server";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req: NextRequest) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ categories: await getNewsCategories() });
}
export async function PATCH(req: NextRequest) {
    try {
        const session = await requireAdmin(req);
        if (session.role === "VIEWER")
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    ;
    const body = await req.json().catch(() => null);
    if (!body || typeof body.slug !== "string")
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    const labels: Record<string, string> = {};
    for (const locale of ["ar", "en", "tr", "fr"]) {
        const label = body.labels?.[locale];
        if (typeof label !== "string" || !label.trim() || label.trim().length > 80)
            return NextResponse.json({ error: "A category name is required in all four languages (maximum 80 characters)." }, { status: 400 });
        labels[locale] = label.trim();
    }
    const { data, error } = await getSupabase().from("NewsCategory").update({ labels }).eq("slug", body.slug).select("slug,labels,sortOrder").maybeSingle();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data)
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json({ category: data });
}
