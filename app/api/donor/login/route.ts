import { loginDonor } from "@/lib/donorAuth";
import { DONOR_AUTH_ERROR_COPY, donorLocale } from '@/lib/donor-email-copy';
import { enforceRequestLimit } from "@/lib/request-limit";
import { getSessionSecret } from "@/lib/session-secret";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    const limited = await enforceRequestLimit(req, "donor-login");
    if (limited) return limited;
    let locale = donorLocale(null);
    try {
        getSessionSecret();
        const { email, password, locale: requestedLocale } = await req.json();
        locale = donorLocale(requestedLocale);
        if (!email || !password)
            return NextResponse.json({ error: DONOR_AUTH_ERROR_COPY[locale].required }, { status: 400 });
        const { user, token } = await loginDonor(email, password);
        const res = NextResponse.json({ ok: true, user });
        res.cookies.set("destekol_donor_session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 30 * 24 * 60 * 60,
        });
        res.cookies.set("donor_name", encodeURIComponent(user.name), {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 30 * 24 * 60 * 60,
        });
        return res;
    }
    catch (e: any) {
        if (e.message === "AUTH_CONFIGURATION_ERROR") {
            return NextResponse.json({ error: DONOR_AUTH_ERROR_COPY[locale].serverError }, { status: 503 });
        }
        const copy = DONOR_AUTH_ERROR_COPY[locale];
        const msgs: Record<string, string> = {
            INVALID_CREDENTIALS: copy.invalidCredentials,
            USE_ADMIN_LOGIN: copy.adminLogin,
            EMAIL_NOT_VERIFIED: copy.unverified,
        };
        return NextResponse.json({ error: msgs[e.message] || copy.invalidCredentials }, { status: 401 });
    }
}
