import { getSessionSecret } from "./lib/session-secret";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { siteForHost, isSiteSession, type SiteId } from "./lib/tenant";
const LOCALES = ["ar", "en", "fr", "tr"];
const COOKIE_NAME = "destekol_admin_session";
async function verifyAdminToken(token: string, site: SiteId): Promise<boolean> {
    try {
        const { payload } = await jwtVerify(token, getSessionSecret(), { algorithms: ["HS256"] });
        return isSiteSession(payload, site) && ["ADMIN", "EDITOR", "VIEWER", "FINANCE", "COMPLAINTS"].includes(payload.role as string);
    }
    catch {
        return false;
    }
}
export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const host = req.headers.get("host") || "";
    // ── تحديد اللغة الافتراضية حسب الدومين ─────────────────────
    let site;
    try {
        site = siteForHost(host, undefined);
    }
    catch {
        return new NextResponse("Site host not configured", { status: 421 });
    }
    const defaultLocale = "tr";
    const requestHeaders = new Headers(req.headers);
    const locale = LOCALES.find(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
        || (pathname.startsWith("/admin") ? "ar" : defaultLocale);
    requestHeaders.set("x-app-locale", locale);
    // Always overwrite client-supplied values with the actual route.
    requestHeaders.set("x-admin-path", pathname);
    // ── 1. Admin route protection ──────────────────────────────
    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !pathname.startsWith("/admin/accept-invite")) {
        const cookie = req.cookies.get(COOKIE_NAME)?.value;
        const authHeader = req.headers.get("authorization");
        const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
        const token = cookie || bearerToken;
        const valid = token ? await verifyAdminToken(token, site.id) : false;
        if (!valid) {
            const loginUrl = req.nextUrl.clone();
            loginUrl.pathname = "/admin/login";
            loginUrl.searchParams.set("next", pathname);
            return NextResponse.redirect(loginUrl);
        }
        return NextResponse.next({ request: { headers: requestHeaders } });
    }
    // ── 2. Skip API, static, _next ──────────────────────────────
    if (pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/admin") ||
        pathname.includes(".")) {
        return NextResponse.next({ request: { headers: requestHeaders } });
    }
    // ── 3. i18n — Check if path already has a locale prefix ─────
    const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
    if (hasLocale)
        return NextResponse.next({ request: { headers: requestHeaders } });
    // ── 4. Unprefixed URLs -> Rewrite internally to domain default locale ──
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|brand/|icons/).*)",
    ],
};
