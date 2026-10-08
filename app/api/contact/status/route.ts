import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { enforceRequestLimit } from '@/lib/request-limit';

export async function POST(req: NextRequest) {
    const limited = await enforceRequestLimit(req, 'contact-status');
    if (limited) return limited;
    try {
        const { reference } = await req.json();
        if (typeof reference !== 'string' || !/^DO-[A-F0-9]{16}$/.test(reference))
            return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
        const { data, error } = await getSupabase().from('ContactMessage').select('reference,status,createdAt,statusUpdatedAt')
            .eq('reference', reference).maybeSingle();
        if (error) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
        if (!data) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
        return NextResponse.json({ request: data }, { headers: { 'Cache-Control': 'no-store' } });
    } catch { return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 }); }
}
