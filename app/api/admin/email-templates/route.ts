import { requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req: NextRequest) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = new URL(req.url).searchParams.get("id");
    if (!id)
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const supabase = getSupabase();
    const { data } = await supabase.from("EmailTemplate").select("*").eq("id", id).maybeSingle();
    return NextResponse.json({ template: data });
}
export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { id, subject, html, blocks, gs } = body;
    if (!id || !subject || !html)
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    // Ensure blocks is always stored as JSON string of array
    const blocksArray = Array.isArray(blocks) ? blocks : (typeof blocks === "string" ? (() => { try {
        return JSON.parse(blocks);
    }
    catch {
        return [];
    } })() : []);
    const supabase = getSupabase();
    const { error } = await supabase.from("EmailTemplate").upsert({
        id, subject, html, blocks: JSON.stringify(blocksArray), gs: gs || null, updatedAt: new Date().toISOString(),
    }, { onConflict: "id" });
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
