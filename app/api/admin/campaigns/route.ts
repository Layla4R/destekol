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
    const { data: campaigns, error } = await supabase
        .from("Campaign")
        .select("id, title, slug, category, country, goalAmount, raisedAmount, donorCount, isActive, isFeatured, isZakatable, defaultAmount, coverImage, createdAt")
        .order("createdAt", { ascending: false })
        .limit(500);
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaigns });
}
export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { title, slug, summary, description, category, coverImage, goalAmount, defaultAmount, country, isActive, isFeatured, isZakatable } = body;
    if (!title || !slug || !goalAmount) {
        return NextResponse.json({ error: "Title, slug and goal amount are required." }, { status: 400 });
    }
    const cleanSlug = String(slug).trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-_]/g, "");
    if (!cleanSlug)
        return NextResponse.json({ error: "Invalid slug — use lowercase letters, numbers and hyphens." }, { status: 400 });
    const supabase = getSupabase();
    const { data: existing } = await supabase.from("Campaign").select("id").eq("slug", cleanSlug).maybeSingle();
    if (existing)
        return NextResponse.json({ error: "A campaign with this slug already exists." }, { status: 400 });
    const { data: campaign, error } = await supabase
        .from("Campaign")
        .insert({
        title,
        slug: cleanSlug,
        summary: summary || "",
        description: description || "",
        category: category || "general",
        coverImage: coverImage || null,
        goalAmount,
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
        isZakatable: isZakatable ?? false,
        country: country || null,
        defaultAmount: defaultAmount != null ? defaultAmount : 25,
    })
        .select("*")
        .single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaign });
}
