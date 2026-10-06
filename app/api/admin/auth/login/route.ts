import { createAdminSession } from "@/lib/auth";
import { getSessionSecret } from "@/lib/session-secret";
import { getSupabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { NextRequest,NextResponse } from "next/server";
const attempts = new Map<string, {
    count: number;
    resetAt: number;
}>();
function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = attempts.get(ip);
    if (!entry || now > entry.resetAt) {
        attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
        return true;
    }
    if (entry.count >= 10)
        return false;
    entry.count++;
    return true;
}
export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
        return NextResponse.json({ error: "Too many login attempts. Please wait 15 minutes." }, { status: 429 });
    }
    try {
        getSessionSecret();
        const { email, password } = await req.json();
        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
        }
        const supabase = getSupabase();
        const { data: user, error } = await supabase
            .from("User")
            .select("id, email, name, role, passwordHash, isStaff")
            .eq("email", email)
            .maybeSingle();
        // Allow ADMIN role OR isStaff=true (staff members with EDITOR/VIEWER roles)
        const isAllowed = user && (user.role === "ADMIN" || user.isStaff === true);
        if (error || !isAllowed || !user.passwordHash) {
            return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }
        const token = await createAdminSession(user.email, user.role);
        return NextResponse.json({ ok: true, token });
    }
    catch (err: any) {
        if (err.message === "AUTH_CONFIGURATION_ERROR") {
            return NextResponse.json({ error: "Authentication is temporarily unavailable." }, { status: 503 });
        }
        if (process.env.NODE_ENV !== "production")
            console.error("Admin login error:", err);
        return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
    }
}
