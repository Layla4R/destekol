import { resetPassword } from "@/lib/donorAuth";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json();
        if (typeof token !== "string" || !token || typeof password !== "string" || !password)
            return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
        if (password.length < 8)
            return NextResponse.json({ error: "PASSWORD_SHORT" }, { status: 400 });
        if (!/\p{L}/u.test(password) || !/[0-9]/.test(password))
            return NextResponse.json({ error: "PASSWORD_WEAK" }, { status: 400 });
        await resetPassword(token, password);
        return NextResponse.json({ ok: true });
    }
    catch (e: any) {
        if (e.message === "INVALID_TOKEN" || e.message === "TOKEN_EXPIRED")
            return NextResponse.json({ error: e.message }, { status: 400 });
        console.error("[donor-reset] Password update failed:", e instanceof Error ? e.message : "UNKNOWN");
        return NextResponse.json({ error: "RESET_UNAVAILABLE" }, { status: 503 });
    }
}
