// Legacy endpoint — kept for backwards compatibility. New code uses PATCH /api/admin/pages
import { requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { order } = await req.json(); // array of page ids in new order
    if (!Array.isArray(order)) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const supabase = getSupabase();
    await Promise.all(order.map((id: string, index: number) => supabase.from("Page").update({ order: index, updatedAt: new Date().toISOString() }).eq("id", id)));
    return NextResponse.json({ ok: true });
}
