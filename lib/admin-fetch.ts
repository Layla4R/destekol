/**
 * Wrapper around fetch for all admin API calls.
 * Sends cookies (credentials: "include") AND Authorization header
 * as a fallback for production environments where cookies may not
 * be forwarded correctly.
 */
const TOKEN_KEY = "destekol_admin_token";
export function storeAdminToken(token: string) {
    if (typeof window !== "undefined") {
        sessionStorage.setItem(TOKEN_KEY, token);
    }
}
export function clearAdminToken() {
    if (typeof window !== "undefined") {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem("destekol_admin_me"); // Clear admin info cache on logout
        sessionStorage.removeItem("destekol_admin_me_ts"); // Clear cache timestamp
    }
}
function getAdminToken(): string | null {
    if (typeof window === "undefined")
        return null;
    return sessionStorage.getItem(TOKEN_KEY);
}
export async function adminFetch(input: string, init?: RequestInit): Promise<Response> {
    const method = (init?.method || "GET").toUpperCase();
    const isFormData = init?.body instanceof FormData;
    // Don't set Content-Type for FormData — browser sets it automatically with boundary
    const needsContentType = ["POST", "PUT", "PATCH"].includes(method) && !isFormData;
    const token = getAdminToken();
    return fetch(input, {
        ...init,
        credentials: "include",
        headers: {
            ...(needsContentType ? { "Content-Type": "application/json" } : {}),
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            ...init?.headers,
        },
    });
}
