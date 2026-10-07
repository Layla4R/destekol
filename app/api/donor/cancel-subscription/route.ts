import { NextResponse } from 'next/server';
export async function POST() {
    return NextResponse.json({ error: 'Online payment subscriptions are not available. Contact info@destekol.org.' }, { status: 503 });
}
