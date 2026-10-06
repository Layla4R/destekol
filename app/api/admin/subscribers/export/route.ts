import { getAdminSession,requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
function csvEscape(v: any): string {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export async function GET(req: Request) {
    let authed = false;
    try {
        await requireAdmin(req);
        authed = true;
    }
    catch { }
    if (!authed) {
        const s = await getAdminSession();
        if (s && ["ADMIN", "EDITOR", "VIEWER"].includes(s.role))
            authed = true;
    }
    if (!authed)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = new URL((req as any).url || "http://localhost");
    const q = url.searchParams.get("q")?.trim() || "";
    const supabase = getSupabase();
    let query = supabase.from("Subscriber").select("email, createdAt, locale").order("createdAt", { ascending: false }).limit(50000);
    if (q)
        query = query.ilike("email", `%${q}%`);
    const { data } = await query;
    const headers = ["Email", "Subscribed At", "Locale"];
    const rows = (data || []).map((s: any) => [
        s.email,
        new Date(s.createdAt).toISOString(),
        s.locale || "ar",
    ]);
    const csv = [headers, ...rows].map(r => r.map(csvEscape).join(",")).join("\n");
    return new NextResponse("\uFEFF" + csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
    });
}
