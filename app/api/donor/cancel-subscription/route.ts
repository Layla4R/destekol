import { NextResponse } from 'next/server';
import { getCurrentDonor } from '@/lib/donorAuth';
import { getSupabase } from '@/lib/supabase';
export async function POST(req: Request) {
    const headers = { 'Cache-Control': 'no-store' };
    const donor = await getCurrentDonor();
    if (!donor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    let donationId: unknown;
    try { ({ donationId } = await req.json()); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers }); }
    if (typeof donationId !== 'string' || !donationId.trim() || donationId.length > 100) return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers });
    const { data, error } = await getSupabase().from('Donation')
        .select('id, frequency, subscriptionStatus').eq('id', donationId).eq('donorEmail', donor.email).maybeSingle();
    if (error) return NextResponse.json({ error: 'Unable to verify subscription' }, { status: 503, headers });
    if (!data || data.frequency !== 'MONTHLY') return NextResponse.json({ error: 'Subscription not found' }, { status: 404, headers });
    // A payment gateway is not connected for recurring donations. No local-only cancellation,
    // provider request, refund, or success response is performed before that integration exists.
    return NextResponse.json({ error: 'RECURRING_NOT_AVAILABLE', contactEmail: 'info@destekol.org',
        message: 'Monthly payment management is not available. Contact us with your subscription reference; no cancellation has been confirmed.' }, { status: 503, headers });
}
