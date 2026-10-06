import { requestPasswordReset } from "@/lib/donorAuth";
import { NextRequest,NextResponse } from "next/server";
const resetAttempts = new Map<string, {
    count: number;
    resetAt: number;
}>();
function checkResetLimit(ip: string): boolean {
    const now = Date.now();
    const entry = resetAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
        resetAttempts.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
        return true;
    }
    if (entry.count >= 5)
        return false;
    entry.count++;
    return true;
}
export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkResetLimit(ip))
        return NextResponse.json({ ok: true }); // Silently rate-limit
    const { email } = await req.json();
    if (email)
        await requestPasswordReset(email).catch(() => { });
    return NextResponse.json({ ok: true }); // Always ok — don't reveal existence
}
