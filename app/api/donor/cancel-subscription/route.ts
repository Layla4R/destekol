import { getCurrentDonor } from "@/lib/donorAuth";
import { loadDonorEmailTemplate,sendMail } from "@/lib/mailer";
import { getRequestSite } from "@/lib/request-site";
import { getStripeAsync } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    const donor = await getCurrentDonor();
    if (!donor)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { donationId } = await req.json();
    const supabase = getSupabase();
    const { data: donation } = await supabase.from("Donation").select("*")
        .eq("id", donationId).eq("donorEmail", donor.email).eq("frequency", "MONTHLY").maybeSingle();
    if (!donation)
        return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    try {
        if (donation.provider === "STRIPE") {
            const stripe = await getStripeAsync();
            let cancelled = false;
            const subs = await stripe.subscriptions.list({ limit: 100 });
            for (const sub of subs.data) {
                if (sub.metadata?.donationId === donationId || sub.id === donation.providerRef) {
                    await stripe.subscriptions.cancel(sub.id);
                    cancelled = true;
                    break;
                }
            }
            if (!cancelled && donation.providerRef) {
                try {
                    await stripe.subscriptions.cancel(donation.providerRef);
                }
                catch { }
            }
        }
        else if (donation.provider === "PAYPAL" && donation.providerRef) {
            // Cancel PayPal subscription via API
            try {
                const { getPaypalAccessToken } = await import("@/lib/paypal");
                const { token, baseUrl } = await getPaypalAccessToken();
                await fetch(`${baseUrl}/v1/billing/subscriptions/${donation.providerRef}/cancel`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ reason: "Donor requested cancellation" }),
                });
            }
            catch { /* PayPal cancel failed — still mark as cancelled in DB */ }
        }
        await supabase.from("Donation").update({ status: "REFUNDED" }).eq("id", donationId);
        const { data: s } = await supabase.from("SiteSettings").select("siteName,contactEmail").eq("id", "default").maybeSingle();
        const siteUrl = getRequestSite().url;
        const cancelVars = {
            donorName: donor.name || donor.email,
            amount: `$${Number(donation.amount).toFixed(2)}`,
            campaignName: donation.campaignId || "General Fund",
            siteUrl,
        };
        const tpl = await loadDonorEmailTemplate("subscription_cancelled", cancelVars);
        if (tpl) {
            sendMail({ to: donor.email, subject: tpl.subject, html: tpl.html }).catch(() => { });
        }
        else {
            sendMail({
                to: donor.email,
                subject: `Subscription Cancelled — ${s?.siteName || "Destekol"}`,
                html: `<div style="font-family:Cairo,Arial,sans-serif;padding:32px;max-width:600px;margin:0 auto;"><h2>Subscription Cancelled</h2><p>Hi ${donor.name},<br/>Your monthly donation has been cancelled. Thank you for your support!</p></div>`,
            }).catch(() => { });
        }
        return NextResponse.json({ ok: true });
    }
    catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
