import type { SupabaseClient } from '@supabase/supabase-js';
export async function confirmPayment(db: SupabaseClient, donationId: string, provider: string, reference: string, amount: number, currency: string, subscriptionRef?: string, paymentReference?: string) {
    const { data, error } = await db.rpc('confirm_donation_payment', { p_donation_id: donationId, p_provider: provider, p_reference: reference, p_amount: amount, p_currency: currency, p_subscription_ref: subscriptionRef || null, p_payment_ref: paymentReference || null });
    if (error) throw new Error('Payment persistence failed');
    return data === true;
}
export async function recordRefund(db: SupabaseClient, donationId: string, provider: string, refund: { id: string; amount: number; currency: string; reason?: string | null; status: 'PENDING' | 'SUCCEEDED' | 'FAILED' }) {
    const { error } = await db.rpc('record_donation_refund', { p_donation_id: donationId, p_provider: provider, p_refund_id: refund.id, p_amount: refund.amount, p_currency: refund.currency, p_reason: refund.reason || null, p_status: refund.status });
    if (error) throw new Error('Refund persistence failed');
}
