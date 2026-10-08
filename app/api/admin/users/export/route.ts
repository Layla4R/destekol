import { requirePermission, accessErrorResponse, auditAccess } from "@/lib/admin-access";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
function csvEscape(v: any): string {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export async function GET(req: Request) {
    let session;
    try { session = await requirePermission('users.export', req); } catch (error) { return accessErrorResponse(error); }
    const url = new URL((req as any).url || "http://localhost");
    const role = url.searchParams.get("role");
    const supabase = getSupabase();
    let query = supabase.from("User").select("id, name, email, role, totalDonated, donationTotals, donationCount, emailVerified, createdAt").order("totalDonated", { ascending: false });
    if (role && role !== "DONOR") return NextResponse.json({ error: "Only donor export is available" }, { status: 400 });
    query = query.eq("role", "DONOR").eq("isStaff", false);
    query = query.limit(50000); // Safety cap — export is meant to be comprehensive
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: "Export failed" }, { status: 503 });
    const headers = ["Name", "Email", "Role", "USD Total", "Totals by currency", "Donations", "Verified", "Joined"];
    const rows = (data || []).map((u: any) => [
        u.name, u.email, u.role,
        u.totalDonated, JSON.stringify(u.donationTotals||{USD:u.totalDonated||0}), u.donationCount,
        u.emailVerified,
        new Date(u.createdAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(csvEscape).join(",")).join("\n");
    try { await auditAccess(session, 'users.export', 'SUCCESS'); } catch(error) { return accessErrorResponse(error); }
    return new NextResponse("\uFEFF" + csv, {
        headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${role === "DONOR" ? "donors" : "users"}-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
    });
}
