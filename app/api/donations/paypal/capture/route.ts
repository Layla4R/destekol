import { incrementCampaignStats } from "@/lib/campaignHelpers";
import { sendDonationReceipt } from "@/lib/mailer";
import { getPaypalAccessToken,getPaypalClientAsync,paypal } from "@/lib/paypal";
import { getRequestSite } from "@/lib/request-site";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req: NextRequest) {
    const siteUrl = getRequestSite().url;
    const donationId = req.nextUrl.searchParams.get("donationId");
    const token = req.nextUrl.searchParams.get("token");
    const type = req.nextUrl.searchParams.get("type");
    // PayPal may send subscription ID as subscription_id OR ba_token OR token
    const subscriptionId = req.nextUrl.searchParams.get("subscription_id") ||
        req.nextUrl.searchParams.get("ba_token") ||
        token;
    if (!donationId)
        return NextResponse.redirect(`${siteUrl}/donate/cancel`);
    try {
        const supabase = getSupabase();
        const { data: donation } = await supabase
            .from("Donation").select("*").eq("id", donationId).maybeSingle();
        if (!donation)
            return NextResponse.redirect(`${siteUrl}/donate/cancel`);
        // ── Subscription approval ────────────────────────────────
        if (type === "subscription") {
            if (!subscriptionId)
                return NextResponse.redirect(`${siteUrl}/donate/cancel`);
            // Get subscription status via direct REST API
            const { token: accessToken, baseUrl } = await getPaypalAccessToken();
            const subRes = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
                headers: { "Authorization": `Bearer ${accessToken}` },
            });
            if (!subRes.ok) {
                if (process.env.NODE_ENV !== "production")
                    console.error("PayPal subscription fetch failed:", await subRes.text());
                return NextResponse.redirect(`${siteUrl}/donate/cancel`);
            }
            const sub = await subRes.json();
            const subStatus = sub.status;
            if (subStatus === "ACTIVE" || subStatus === "APPROVED") {
                // Idempotency: only process if not already COMPLETED
                if (donation.status !== "COMPLETED") {
                    await supabase.from("Donation").update({
                        status: "COMPLETED",
                        providerRef: subscriptionId,
                        paidAt: new Date().toISOString(),
                    }).eq("id", donationId);
                    // Update campaign
                    if (donation.campaignId) {
                        await incrementCampaignStats(donation.campaignId, Number(donation.amount), true);
                    }
                    // Send receipt
                    if (!donation.isAnonymous && donation.donorEmail) {
                        sendDonationReceipt({
                            to: donation.donorEmail,
                            donorName: donation.donorName,
                            amount: Number(donation.amount),
                            currency: donation.currency || "usd",
                            frequency: "MONTHLY",
                            receiptNumber: donation.receiptNumber || "",
                        }).catch(() => { });
                    }
                }
                return NextResponse.redirect(`${siteUrl}/donate/success?donation=${donationId}`);
            }
            // Subscription not yet active — mark as failed and pass donationId for cleanup
            await supabase.from("Donation").update({ status: "FAILED" }).eq("id", donationId);
            return NextResponse.redirect(`${siteUrl}/donate/cancel?donation=${donationId}`);
        }
        // ── One-time Order Capture ────────────────────────────────
        if (!token)
            return NextResponse.redirect(`${siteUrl}/donate/cancel`);
        const client = await getPaypalClientAsync();
        const request = new paypal.orders.OrdersCaptureRequest(token);
        // @ts-ignore - SDK requires empty body
        request.requestBody({});
        const capture = await client.execute(request);
        const status = capture.result.status;
        if (status === "COMPLETED") {
            // Idempotency: only process if not already COMPLETED
            if (donation.status !== "COMPLETED") {
                await supabase.from("Donation").update({ status: "COMPLETED", paidAt: new Date().toISOString() }).eq("id", donationId);
                // Update campaign
                if (donation.campaignId) {
                    await incrementCampaignStats(donation.campaignId, Number(donation.amount), true);
                }
                // Send receipt
                if (!donation.isAnonymous && donation.donorEmail) {
                    sendDonationReceipt({
                        to: donation.donorEmail,
                        donorName: donation.donorName,
                        amount: Number(donation.amount),
                        currency: donation.currency || "usd",
                        frequency: donation.frequency || "ONE_TIME",
                        receiptNumber: donation.receiptNumber || "",
                    }).catch(() => { });
                }
            }
            return NextResponse.redirect(`${siteUrl}/donate/success?donation=${donationId}`);
        }
        await supabase.from("Donation").update({ status: "FAILED" }).eq("id", donationId);
        return NextResponse.redirect(`${siteUrl}/donate/cancel`);
    }
    catch (err) {
        if (process.env.NODE_ENV !== "production")
            console.error("PayPal capture error:", err);
        return NextResponse.redirect(`${siteUrl}/donate/cancel`);
    }
}
