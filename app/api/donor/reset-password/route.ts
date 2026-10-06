import { resetPassword } from "@/lib/donorAuth";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json();
        if (!token || !password)
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        if (password.length < 8)
            return NextResponse.json({ error: "Password too short" }, { status: 400 });
        if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
            return NextResponse.json({ error: "Password must contain at least one letter and one number" }, { status: 400 });
        await resetPassword(token, password);
        return NextResponse.json({ ok: true });
    }
    catch (e: any) {
        const msgs: Record<string, string> = {
            INVALID_TOKEN: "رابط غير صالح",
            TOKEN_EXPIRED: "انتهت صلاحية الرابط — اطلب رابطاً جديداً",
        };
        return NextResponse.json({ error: msgs[e.message] || e.message }, { status: 400 });
    }
}
