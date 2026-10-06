import { SignJWT,jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getRequestSite } from "./request-site";
import { getSessionSecret } from "./session-secret";
import { getSupabase } from "./supabase";
import { isSiteSession } from "./tenant";
const COOKIE_NAME = "destekol_admin_session";
export async function createAdminSession(email: string, role = "ADMIN"): Promise<string> {
    const token = await new SignJWT({ email, role, site: getRequestSite().id })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(getSessionSecret());
    const isProd = process.env.NODE_ENV === "production";
    cookies().set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "strict" : "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });
    return token;
}
export function clearAdminSession() {
    cookies().delete(COOKIE_NAME);
}
export async function getAdminSession(req?: {
    headers: {
        get: (k: string) => string | null;
    };
}) {
    let token = cookies().get(COOKIE_NAME)?.value;
    if (!token && req) {
        const auth = req.headers.get("authorization") || req.headers.get("Authorization");
        if (auth?.startsWith("Bearer "))
            token = auth.slice(7);
    }
    if (!token)
        return null;
    try {
        const { payload } = await jwtVerify(token, getSessionSecret(), { algorithms: ["HS256"] });
        if (!isSiteSession(payload, getRequestSite().id) || typeof payload.email !== "string")
            return null;
        // Membership and role are rechecked in this site's schema, so removal takes effect immediately.
        const { data: user, error } = await getSupabase().from("User")
            .select("email, role, isStaff").eq("email", payload.email).maybeSingle();
        if (error || !user || !(user.role === "ADMIN" || user.isStaff === true) || !["ADMIN", "EDITOR", "VIEWER"].includes(user.role))
            return null;
        return { email: user.email as string, role: user.role as string, site: getRequestSite().id };
    }
    catch {
        return null;
    }
}
export async function requireAdmin(req?: {
    headers: {
        get: (k: string) => string | null;
    };
}) {
    const session = await getAdminSession(req);
    // Allow ADMIN role OR any authenticated session (staff with EDITOR/VIEWER checked separately via permissions)
    if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR" && session.role !== "VIEWER")) {
        throw new Error("UNAUTHORIZED");
    }
    return session;
}
export async function requireSuperAdmin(req?: {
    headers: {
        get: (k: string) => string | null;
    };
}) {
    const session = await getAdminSession(req);
    if (!session || session.role !== "ADMIN") {
        throw new Error("UNAUTHORIZED");
    }
    return session;
}
