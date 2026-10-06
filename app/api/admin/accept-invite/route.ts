import { acceptAdminInvite } from "@/lib/adminInvite";
import { NextRequest,NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json();
        if (!token || !password)
            return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
        if (password.length < 8)
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
            return NextResponse.json({ error: "Password must contain at least one letter and one number" }, { status: 400 });
        const result = await acceptAdminInvite(token, password);
        return NextResponse.json({ ok: true, ...result });
    }
    catch (e: any) {
        const msgs: Record<string, string> = {
            INVALID_TOKEN: "Invalid or expired invitation link",
            ALREADY_ACCEPTED: "This invitation has already been accepted",
            TOKEN_EXPIRED: "This invitation has expired — ask for a new one",
        };
        return NextResponse.json({ error: msgs[e.message] || e.message }, { status: 400 });
    }
}
