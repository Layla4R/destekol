import { requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
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
    const { data: campaign, error } = await supabase.from("Campaign").select("*").eq("id", params.id).maybeSingle();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    if (!campaign)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ campaign });
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
    for (const key of [
        "title", "summary", "description", "category", "coverImage",
        "goalAmount", "raisedAmount", "defaultAmount", "country",
        "isActive", "isFeatured", "isZakatable",
        "authorName", "authorRole", "publishedAt"
    ]) {
        if (body[key] !== undefined)
            data[key] = body[key];
    }
    const supabase = getSupabase();
    if (body.slug !== undefined) {
        const cleanSlug = String(body.slug).trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-_]/g, "");
        if (!cleanSlug)
            return NextResponse.json({ error: "Invalid slug — use lowercase letters, numbers and hyphens." }, { status: 400 });
        const { data: existing } = await supabase.from("Campaign").select("id").eq("slug", cleanSlug).maybeSingle();
        if (existing && existing.id !== params.id) {
            return NextResponse.json({ error: "A campaign with this slug already exists." }, { status: 400 });
        }
        data.slug = cleanSlug;
    }
    data.updatedAt = new Date().toISOString();
    const { data: campaign, error } = await supabase
        .from("Campaign")
        .update(data)
        .eq("id", params.id)
        .select("*")
        .single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaign });
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
    const { count: completedCount } = await supabase.from("Donation").select("id", { count: "exact", head: true }).eq("campaignId", params.id).eq("status", "COMPLETED");
    if ((completedCount || 0) > 0) {
        return NextResponse.json({ error: `Cannot delete — this campaign has ${completedCount} completed donation(s). Deactivate it instead.` }, { status: 409 });
    }
    await supabase.from("Donation").update({ status: "FAILED" }).eq("campaignId", params.id).eq("status", "PENDING");
    const { error } = await supabase.from("Campaign").delete().eq("id", params.id);
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
