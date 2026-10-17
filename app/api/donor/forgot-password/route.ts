import { requestPasswordReset } from "@/lib/donorAuth";
import { donorLocale } from '@/lib/donor-email-copy';
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
    let email: unknown;
    let requestedLocale: unknown;
    try {
        ({ email, locale: requestedLocale } = await req.json());
    }
    catch {
        return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }
    if (typeof email !== "string" || !email.trim())
        return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkResetLimit(ip))
        return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    try {
        await requestPasswordReset(email, donorLocale(requestedLocale));
        return NextResponse.json({ ok: true }); // Do not reveal whether the account exists.
    }
    catch (error) {
        console.error("[donor-reset] Request failed:", error instanceof Error ? error.message : "UNKNOWN");
        return NextResponse.json({ error: "RESET_UNAVAILABLE" }, { status: 503 });
    }
}
