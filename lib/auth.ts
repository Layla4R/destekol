import { SignJWT,jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
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
            .select("id, email, role, isStaff, permissions, accessExpiresAt").eq("email", payload.email).maybeSingle();
        if (error || !user || !(user.role === "ADMIN" || user.isStaff === true) || !["ADMIN", "EDITOR", "VIEWER", "FINANCE", "COMPLAINTS"].includes(user.role))
            return null;
        if (user.accessExpiresAt && Date.parse(user.accessExpiresAt) <= Date.now()) return null;
        return { id: user.id as string, email: user.email as string, role: user.role as string, isStaff: user.isStaff === true, permissions: Array.isArray(user.permissions) ? user.permissions as string[] : [], site: getRequestSite().id };
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
    const route = headers().get("x-admin-path");
    if (!req && route?.startsWith("/admin") && !["/admin/login","/admin/accept-invite"].includes(route)) return (await import("./admin-access")).requirePagePermission(route);
    const session = await getAdminSession(req);
    // Allow ADMIN role OR any authenticated session (staff with EDITOR/VIEWER checked separately via permissions)
    if (!session || !["ADMIN", "EDITOR", "VIEWER", "FINANCE", "COMPLAINTS"].includes(session.role)) {
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
    if (!session || session.role !== "ADMIN" || session.isStaff) {
        throw new Error("UNAUTHORIZED");
    }
    return session;
}
