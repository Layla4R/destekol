import { registerDonor } from "@/lib/donorAuth";
import { DONOR_AUTH_ERROR_COPY, donorLocale } from '@/lib/donor-email-copy';
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    let locale = donorLocale(null);
    try {
        const { name, email, password, country, locale: requestedLocale } = await req.json();
        locale = donorLocale(requestedLocale);
        const copy = DONOR_AUTH_ERROR_COPY[locale];
        if (!name || !email || !password)
            return NextResponse.json({ error: copy.required }, { status: 400 });
        if (password.length < 8)
            return NextResponse.json({ error: copy.passwordShort }, { status: 400 });
        const user = await registerDonor({ name, email, password, country, locale });
        return NextResponse.json({ ok: true, user });
    }
    catch (e: any) {
        const copy = DONOR_AUTH_ERROR_COPY[locale];
        if (e.message === "EMAIL_EXISTS")
            return NextResponse.json({ error: copy.emailExists }, { status: 400 });
        return NextResponse.json({ error: copy.registerFailed }, { status: 500 });
    }
}
