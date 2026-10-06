import { incrementCampaignStats } from "@/lib/campaignHelpers";
import { generateReceiptNumber } from "@/lib/format";
import { sendAdminDonationNotification,sendDonationReceipt } from "@/lib/mailer";
import { siteEnv } from "@/lib/request-site";
import { getStripeAsync } from "@/lib/stripe";
import { getSupabase,getSupabaseOrNull } from "@/lib/supabase";
import { NextRequest,NextResponse } from "next/server";
import Stripe from "stripe";
export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    // Read webhook secret from DB first, fallback to env
    let webhookSecret = siteEnv("STRIPE_WEBHOOK_SECRET") || "";
    const supabaseOrNull = getSupabaseOrNull();
    if (supabaseOrNull) {
        const { data: settings } = await supabaseOrNull
            .from("SiteSettings")
            .select("stripeWebhookSecret")
            .eq("id", "default")
            .maybeSingle();
        if (settings?.stripeWebhookSecret)
            webhookSecret = settings.stripeWebhookSecret;
    }
    const stripe = await getStripeAsync();
    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig as string, webhookSecret);
    }
    catch (err: any) {
        if (process.env.NODE_ENV !== "production")
            console.error("Stripe webhook signature failed:", err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    try {
        let supabase: any;
        try {
            supabase = getSupabase();
        }
        catch (e) {
            console.error("[stripe-webhook] Supabase unavailable:", e);
            return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
        }
        // ── checkout.session.completed ────────────────────────────
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const donationId = session.metadata?.donationId;
            if (!donationId)
                return NextResponse.json({ received: true });
            const { data: donation } = await supabase
                .from("Donation").select("*").eq("id", donationId).maybeSingle();
            if (donation && donation.status !== "COMPLETED") {
                // For subscriptions, store the subscription_id as providerRef so
                // invoice.payment_succeeded can find it later
                // subscription is set for monthly, null for one-time
                const subId = typeof session.subscription === "string" ? session.subscription : null;
                await supabase.from("Donation").update({
                    status: "COMPLETED",
                    providerRef: subId || session.id,
                    paidAt: new Date().toISOString(),
                }).eq("id", donationId);
                // Update campaign (atomic to avoid race conditions)
                if (donation.campaignId) {
                    await incrementCampaignStats(donation.campaignId, Number(donation.amount), true);
                }
                // Send receipt to donor
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
                // Notify admin of new donation
                try {
                    const { data: adminCfg } = await supabase.from("SiteSettings").select("contactEmail").eq("id", "default").maybeSingle();
                    if (adminCfg?.contactEmail) {
                        sendAdminDonationNotification({
                            adminEmail: adminCfg.contactEmail,
                            donorName: donation.donorName,
                            donorEmail: donation.donorEmail,
                            amount: Number(donation.amount),
                            currency: donation.currency || "usd",
                            frequency: donation.frequency || "ONE_TIME",
                            provider: "STRIPE",
                            receiptNumber: donation.receiptNumber || "",
                        }).catch(() => { });
                    }
                }
                catch { }
                // Update user totalDonated and donationCount
                if (donation.donorEmail) {
                    try {
                        const { data: donor } = await supabase.from("User").select("id, totalDonated, donationCount").eq("email", donation.donorEmail).maybeSingle();
                        if (donor) {
                            await supabase.from("User").update({
                                totalDonated: Number(donor.totalDonated || 0) + Number(donation.amount),
                                donationCount: (donor.donationCount || 0) + 1,
                            }).eq("id", donor.id);
                        }
                    }
                    catch { }
                }
            }
        }
        // ── invoice.payment_succeeded — recurring monthly payments ─
        if (event.type === "invoice.payment_succeeded") {
            const invoice = event.data.object as Stripe.Invoice;
            // Only handle subscription invoices after the first payment
            // (first payment is handled by checkout.session.completed)
            if (invoice.billing_reason === "subscription_cycle" && invoice.subscription) {
                // Find the original donation by subscription_id (stored as providerRef after first payment)
                const subId = invoice.subscription as string;
                const { data: originalDonation } = await supabase
                    .from("Donation")
                    .select("*")
                    .eq("providerRef", subId)
                    .eq("frequency", "MONTHLY")
                    .eq("status", "COMPLETED")
                    .maybeSingle();
                if (originalDonation) {
                    // Insert a new donation record for this recurring payment
                    const { data: newDonation, error: insertErr } = await supabase.from("Donation").insert({
                        campaignId: originalDonation.campaignId || null,
                        donorName: originalDonation.donorName,
                        donorEmail: originalDonation.donorEmail,
                        amount: originalDonation.amount,
                        currency: originalDonation.currency || "usd",
                        frequency: "MONTHLY",
                        status: "COMPLETED",
                        provider: "STRIPE",
                        providerRef: invoice.id,
                        isAnonymous: originalDonation.isAnonymous,
                        receiptNumber: generateReceiptNumber(),
                    }).select("*").single();
                    if (insertErr) {
                        console.error("invoice.payment_succeeded: failed to insert recurring donation:", insertErr.message);
                    }
                    // Update campaign (atomic — donor count unchanged for recurring)
                    if (originalDonation.campaignId) {
                        await incrementCampaignStats(originalDonation.campaignId, Number(originalDonation.amount), false);
                    }
                    // Send receipt for recurring payment
                    if (newDonation && !originalDonation.isAnonymous && originalDonation.donorEmail) {
                        sendDonationReceipt({
                            to: originalDonation.donorEmail,
                            donorName: originalDonation.donorName,
                            amount: Number(originalDonation.amount),
                            currency: originalDonation.currency || "usd",
                            frequency: "MONTHLY",
                            receiptNumber: newDonation.receiptNumber || "",
                        }).catch(() => { });
                    }
                }
            }
        }
        // ── checkout.session.expired — user abandoned checkout ────
        if (event.type === "checkout.session.expired") {
            const session = event.data.object as Stripe.Checkout.Session;
            const donationId = session.metadata?.donationId;
            if (donationId) {
                await supabase.from("Donation").update({ status: "FAILED" })
                    .eq("id", donationId).eq("status", "PENDING");
            }
        }
        // ── payment_intent.payment_failed ─────────────────────────
        // checkout.session.expired handles the abandoned checkout case.
        // payment_intent.payment_failed covers card declines during an active session.
        if (event.type === "payment_intent.payment_failed") {
            const pi = event.data.object as Stripe.PaymentIntent;
            // Only look up if there's a linked checkout session
            if (pi.id) {
                try {
                    const sessions = await stripe.checkout.sessions.list({ payment_intent: pi.id, limit: 1 });
                    const donationId = sessions.data[0]?.metadata?.donationId;
                    if (donationId) {
                        await supabase.from("Donation").update({ status: "FAILED" })
                            .eq("id", donationId).eq("status", "PENDING");
                    }
                }
                catch {
                }
            }
        }
        // ── customer.subscription.deleted ─────────────────────────
        // Better event for subscription cancellation than charge.refunded
        if (event.type === "customer.subscription.deleted") {
            const sub = event.data.object as Stripe.Subscription;
            if (sub.id) {
                await supabase.from("Donation")
                    .update({ status: "REFUNDED" })
                    .eq("providerRef", sub.id)
                    .eq("frequency", "MONTHLY");
            }
        }
        // ── charge.refunded — one-time payment refunds ────────────
        if (event.type === "charge.refunded") {
            const charge = event.data.object as Stripe.Charge;
            const piId = charge.payment_intent as string | null;
            if (piId) {
                try {
                    // Look up checkout session by payment_intent to get donationId
                    const sessions = await stripe.checkout.sessions.list({ payment_intent: piId, limit: 1 });
                    const donationId = sessions.data[0]?.metadata?.donationId;
                    if (donationId) {
                        await supabase.from("Donation").update({ status: "REFUNDED" }).eq("id", donationId);
                    }
                }
                catch {
                    // Non-critical: if lookup fails, donation status stays COMPLETED
                    console.error("charge.refunded: could not look up session for pi:", piId);
                }
            }
        }
        return NextResponse.json({ received: true });
    }
    catch (err) {
        console.error("Stripe webhook handler error:", err);
        return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
    }
}
