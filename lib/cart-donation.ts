import type { SupabaseClient } from '@supabase/supabase-js';
import { validDonationAmount } from './payment-lifecycle';

export type CartAllocation = { campaignId: string | null; amount: number; frequency: 'ONE_TIME' | 'MONTHLY' };
// Called by the payment adapter before requesting one token for the entire cart.
// The database persists the parent and every allocation in one transaction.
export async function createCartDonation(db: SupabaseClient, donor: { name: string; email: string }, currency: string, reference: string, items: CartAllocation[]) {
    if (!items.length || items.length > 50 || items.some(item => !validDonationAmount(item.amount) || !['ONE_TIME', 'MONTHLY'].includes(item.frequency))) throw new Error('Invalid cart');
    if (new Set(items.map(item => item.frequency)).size !== 1) throw new Error('Mixed donation frequencies are not enabled');
    const { data, error } = await db.rpc('create_cart_donation', { p_name: donor.name, p_email: donor.email, p_currency: currency, p_reference: reference, p_items: items });
    if (error || typeof data !== 'string') throw new Error('Cart allocation could not be saved');
    return { donationId: data, total: items.reduce((sum, item) => sum + Math.round(item.amount * 100), 0) / 100 };
}
