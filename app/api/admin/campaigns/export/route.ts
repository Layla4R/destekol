import { requireRoutePermission, accessErrorResponse } from "@/lib/admin-access";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
function csvEscape(v: any): string {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export async function GET(req: Request) {
    try { await requireRoutePermission(req); } catch(error) { return accessErrorResponse(error); }
    const supabase = getSupabase();
    const { data } = await supabase.from("Campaign").select("*").order("createdAt", { ascending: false }).limit(10000);
    const headers = ["ID", "Title", "Slug", "Category", "Country", "Goal", "Raised", "Donors", "Active", "Featured", "Zakatable", "Default Amount", "Created"];
    const rows = (data || []).map((c: any) => [
        c.id, c.title || "", c.slug || "", c.category || "", c.country || "",
        Number(c.goalAmount || 0).toFixed(2),
        Number(c.raisedAmount || 0).toFixed(2),
        Number(c.donorCount || 0),
        c.isActive ? "Yes" : "No", c.isFeatured ? "Yes" : "No",
        c.isZakatable ? "Yes" : "No",
        Number(c.defaultAmount || 25).toFixed(2),
        new Date(c.createdAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(csvEscape).join(",")).join("\n");
    return new NextResponse("\uFEFF" + csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="campaigns-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
    });
}
