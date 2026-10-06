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
    const role = url.searchParams.get("role");
    const supabase = getSupabase();
    let query = supabase.from("User").select("id, name, email, role, totalDonated, donationCount, emailVerified, createdAt").order("totalDonated", { ascending: false });
    if (role)
        query = query.eq("role", role);
    query = query.limit(50000); // Safety cap — export is meant to be comprehensive
    const { data } = await query;
    const headers = ["Name", "Email", "Role", "Total Donated", "Donations", "Verified", "Joined"];
    const rows = (data || []).map((u: any) => [
        u.name, u.email, u.role,
        u.totalDonated, u.donationCount,
        u.emailVerified,
        new Date(u.createdAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(csvEscape).join(",")).join("\n");
    return new NextResponse("\uFEFF" + csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${role === "DONOR" ? "donors" : "users"}-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
    });
}
