import { getAdminSession,requireAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
function csvEscape(value: any): string {
    const str = String(value ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
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
        if (s?.role === "ADMIN")
            authed = true;
    }
    if (!authed)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = new URL((req as any).url || "http://localhost");
    const statusFilter = url.searchParams.get("status") || "";
    const campaignFilter = url.searchParams.get("campaign") || "";
    const q = url.searchParams.get("q")?.trim() || "";
    const supabase = getSupabase();
    let query = supabase
        .from("Donation")
        .select("*, campaign:Campaign(title)")
        .order("createdAt", { ascending: false })
        .limit(10000);
    if (statusFilter)
        query = query.eq("status", statusFilter);
    if (campaignFilter)
        query = query.eq("campaignId", campaignFilter);
    if (q)
        query = query.or(`donorName.ilike.%${q}%,donorEmail.ilike.%${q}%`);
    const { data: donations, error } = await query;
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    const headers = ["Date", "Donor Name", "Donor Email", "Amount", "Currency", "Campaign", "Gateway", "Frequency", "Status", "Receipt #", "Anonymous", "Subscription Status", "Refund Status", "Refunded Amount"];
    const rows = (donations || []).map((d: any) => [
        new Date(d.createdAt).toISOString(),
        d.donorName, d.donorEmail, d.amount,
        d.currency?.toUpperCase(),
        d.campaign?.title || "",
        d.provider,
        d.frequency === "MONTHLY" ? "Monthly" : "One-time",
        d.status, d.receiptNumber || "",
        d.isAnonymous ? "Yes" : "No",
        d.subscriptionStatus || '', d.refundStatus || 'NONE', d.refundedAmount || 0,
    ]);
    const csv = [headers, ...rows].map(row => row.map(csvEscape).join(",")).join("\n");
    return new NextResponse("\uFEFF" + csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="donations-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
    });
}
