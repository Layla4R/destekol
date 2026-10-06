import { requireAdmin } from "@/lib/auth";
import { sendDonationReceipt } from "@/lib/mailer";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req);
    }
    catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { donationId } = await req.json();
    const supabase = getSupabase();
    const { data: d } = await supabase.from("Donation").select("*, campaign:Campaign(title)").eq("id", donationId).maybeSingle();
    if (!d)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    await sendDonationReceipt({
        to: d.donorEmail,
        donorName: d.donorName,
        amount: Number(d.amount),
        currency: d.currency || "usd",
        frequency: d.frequency,
        receiptNumber: d.receiptNumber || "",
        campaignTitle: (d.campaign as any)?.title || undefined,
        donationDate: new Date(d.createdAt).toLocaleDateString("en-GB"),
    });
    return NextResponse.json({ ok: true });
}
