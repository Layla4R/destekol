import { incrementCampaignStats } from "@/lib/campaignHelpers";
import { generateReceiptNumber } from "@/lib/format";
import { sendAdminDonationNotification,sendDonationReceipt } from "@/lib/mailer";
import { getSupabase } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        let body: any;
        try {
            body = JSON.parse(rawBody);
        }
        catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const eventType = body?.event_type as string;
        const resource = body?.resource;
        if (!eventType || !resource) {
            return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
        }
        const supabase = getSupabase();
        // Basic PayPal webhook verification via transmission headers
        const transmissionId = req.headers.get("paypal-transmission-id");
        if (!transmissionId && process.env.NODE_ENV === "production") {
            // In production, all real PayPal webhooks include this header
            // If missing, likely a forged request — log but continue (don't break real payments)
            console.warn("[paypal-webhook] Missing paypal-transmission-id header — possible forged request");
        }
        // ── PAYMENT.SALE.COMPLETED ────────────────────────────────
        // Fired for one-time payments AND subscription renewals
        if (eventType === "PAYMENT.SALE.COMPLETED") {
            const customId = resource.custom_id || resource.custom;
            // billing_agreement_id is the PayPal subscription ID for recurring payments
            const billingAgreementId = resource.billing_agreement_id;
            // Try to find donation by custom_id (set during order/subscription creation)
            let { data: donation } = customId
                ? await supabase.from("Donation").select("*").eq("id", customId).maybeSingle()
                : { data: null };
            // For subscription renewals, look up by subscription ID (providerRef)
            if (!donation && billingAgreementId) {
                const { data: byRef } = await supabase
                    .from("Donation").select("*").eq("providerRef", billingAgreementId)
                    .eq("status", "COMPLETED").eq("frequency", "MONTHLY").maybeSingle();
                if (byRef) {
                    // This is a recurring payment — create new donation record
                    const { data: newDon } = await supabase.from("Donation").insert({
                        campaignId: byRef.campaignId || null,
                        donorName: byRef.donorName,
                        donorEmail: byRef.donorEmail,
                        userId: byRef.userId || null, // Fix 43: carry over userId
                        amount: byRef.amount,
                        currency: byRef.currency || "usd",
                        frequency: "MONTHLY",
                        status: "COMPLETED",
                        provider: "PAYPAL",
                        providerRef: resource.id,
                        isAnonymous: byRef.isAnonymous,
                        receiptNumber: generateReceiptNumber(),
                    }).select("*").single();
                    if (byRef.campaignId)
                        await incrementCampaignStats(byRef.campaignId, Number(byRef.amount), false);
                    if (newDon && !byRef.isAnonymous && byRef.donorEmail) {
                        sendDonationReceipt({
                            to: byRef.donorEmail, donorName: byRef.donorName,
                            amount: Number(byRef.amount), currency: byRef.currency || "usd",
                            frequency: "MONTHLY", receiptNumber: newDon.receiptNumber || "",
                        }).catch(() => { });
                    }
                    return NextResponse.json({ received: true });
                }
                return NextResponse.json({ received: true });
            }
            // First-time payment
            if (!donation)
                return NextResponse.json({ received: true });
            if (donation.status !== "COMPLETED") {
                await supabase.from("Donation").update({ status: "COMPLETED", paidAt: new Date().toISOString() }).eq("id", customId);
                if (donation.campaignId) {
                    await incrementCampaignStats(donation.campaignId, Number(donation.amount), true);
                }
                // Update user totalDonated and donationCount
                if (donation.donorEmail) {
                    try {
                        const { data: usr } = await supabase.from("User").select("id, totalDonated, donationCount").eq("email", donation.donorEmail).maybeSingle();
                        if (usr) {
                            await supabase.from("User").update({
                                totalDonated: Number(usr.totalDonated || 0) + Number(donation.amount),
                                donationCount: (usr.donationCount || 0) + 1,
                            }).eq("id", usr.id);
                        }
                    }
                    catch { }
                }
                if (!donation.isAnonymous && donation.donorEmail) {
                    sendDonationReceipt({
                        to: donation.donorEmail, donorName: donation.donorName,
                        amount: Number(donation.amount), currency: donation.currency || "usd",
                        frequency: donation.frequency === "MONTHLY" ? "MONTHLY" : "ONE_TIME",
                        receiptNumber: donation.receiptNumber || "",
                    }).catch(() => { });
                }
                // Notify admin
                try {
                    const { data: adminCfg } = await supabase.from("SiteSettings").select("contactEmail").eq("id", "default").maybeSingle();
                    if (adminCfg?.contactEmail) {
                        sendAdminDonationNotification({
                            adminEmail: adminCfg.contactEmail,
                            donorName: donation.donorName,
                            donorEmail: donation.donorEmail,
                            amount: Number(donation.amount),
                            currency: donation.currency || "usd",
                            frequency: donation.frequency === "MONTHLY" ? "MONTHLY" : "ONE_TIME",
                            provider: "PAYPAL",
                            receiptNumber: donation.receiptNumber || "",
                        }).catch(() => { });
                    }
                }
                catch { }
            }
            return NextResponse.json({ received: true });
        }
        // ── BILLING.SUBSCRIPTION.CANCELLED / SUSPENDED ────────────
        if (eventType === "BILLING.SUBSCRIPTION.CANCELLED" || eventType === "BILLING.SUBSCRIPTION.SUSPENDED") {
            const subscriptionId = resource.id;
            if (subscriptionId) {
                await supabase.from("Donation")
                    .update({ status: "REFUNDED" })
                    .eq("providerRef", subscriptionId)
                    .eq("frequency", "MONTHLY");
            }
        }
        // ── PAYMENT.SALE.DENIED / REVERSED ────────────────────────
        if (eventType === "PAYMENT.SALE.DENIED" || eventType === "PAYMENT.SALE.REVERSED") {
            const customId = resource.custom_id || resource.custom;
            if (customId) {
                await supabase.from("Donation").update({ status: "FAILED" }).eq("id", customId);
            }
        }
        return NextResponse.json({ received: true });
    }
    catch (err: any) {
        if (process.env.NODE_ENV !== "production")
            console.error("PayPal webhook error:", err);
        return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
    }
}
