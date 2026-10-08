import { requirePermission, accessErrorResponse, auditAccess } from "@/lib/admin-access";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
function csvEscape(v: any): string {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export async function GET(req: Request) {
    let session;
    try { session = await requirePermission('subscribers.export', req); } catch (error) { return accessErrorResponse(error); }
    const url = new URL((req as any).url || "http://localhost");
    const q = url.searchParams.get("q")?.trim() || "";
    const supabase = getSupabase();
    let query = supabase.from("Subscriber").select("email, createdAt, consentAt, consentLocale, consentVersion").eq("active",true).not("consentAt","is",null).order("createdAt", { ascending: false }).limit(50000);
    if (q)
        query = query.ilike("email", `%${q}%`);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: "Export failed" }, { status: 503 });
    const headers = ["Email", "Subscribed At", "Consent At", "Consent Locale", "Consent Version"];
    const rows = (data || []).map((s: any) => [
        s.email,
        new Date(s.createdAt).toISOString(), s.consentAt, s.consentLocale, s.consentVersion,
    ]);
    const csv = [headers, ...rows].map(r => r.map(csvEscape).join(",")).join("\n");
    try { await auditAccess(session, 'subscribers.export', 'SUCCESS'); } catch(error) { return accessErrorResponse(error); }
    return new NextResponse("\uFEFF" + csv, {
        headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
    });
}
