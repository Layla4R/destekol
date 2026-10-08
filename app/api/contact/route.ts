import { randomBytes, randomUUID } from 'node:crypto';
import { getSupabaseOrNull } from '@/lib/supabase';
import { notifyContact } from '@/lib/contact-notifications';
import { enforceRequestLimit } from '@/lib/request-limit';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
    const limited = await enforceRequestLimit(req, 'contact');
    if (limited) return limited;
    try {
        const { name, email, subject, message, locale } = await req.json();
        if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string' || !name.trim() || !email.trim() || !message.trim() || (subject != null && typeof subject !== 'string'))
            return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
            return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
        if (message.trim().length > 5000 || name.length > 200 || email.length > 254 || (subject?.length || 0) > 300)
            return NextResponse.json({ error: 'One or more fields are too long.' }, { status: 400 });
        const db = getSupabaseOrNull();
        if (!db) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
        const id = randomUUID();
        const reference = 'DO-' + randomBytes(8).toString('hex').toUpperCase();
        const { error } = await db.from('ContactMessage').insert({
            id, reference,
            name: name.trim(), email: email.trim().toLowerCase(), subject: subject?.trim() || null, message: message.trim(),
        });
        if (error) return NextResponse.json({ error: 'Message could not be saved. Please try again.' }, { status: 503 });
        // The message and its pending notice are durable before notification is attempted.
        try { await notifyContact(id); } catch { /* Persisted pending/leased notices remain retryable. */ }
        const language = ['ar','en','fr','tr'].includes(locale) ? locale : 'tr';
        return NextResponse.json({ ok: true, reference, status: 'RECEIVED',
            trackingUrl: `/${language}/contact/track#reference=${reference}` },
            { headers: { 'Cache-Control': 'no-store' } });
    } catch { return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 }); }
}
