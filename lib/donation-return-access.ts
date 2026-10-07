import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getSessionSecret } from './session-secret';
import { getRequestSite } from './request-site';

export const DONATION_ACCESS_COOKIE = 'destekol_donation_return';
export async function readDonationAccess(token?: string): Promise<string[]> {
    if (!token) return [];
    try {
        const { payload } = await jwtVerify(token, getSessionSecret(), { algorithms: ['HS256'] });
        if (payload.purpose !== 'donation-return' || payload.site !== getRequestSite().id || !Array.isArray(payload.donations)) return [];
        return payload.donations.filter((id): id is string => typeof id === 'string');
    } catch { return []; }
}
export async function grantDonationAccess<T extends { cookies: { set: Function } }>(response: T, id: string, previous?: string): Promise<T> {
    const ids = [...new Set([...await readDonationAccess(previous), id])].slice(-10);
    const token = await new SignJWT({ purpose: 'donation-return', site: getRequestSite().id, donations: ids })
        .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('2h').sign(getSessionSecret());
    response.cookies.set(DONATION_ACCESS_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7200 });
    return response;
}
export async function hasDonationReturnAccess(id: string) {
    return (await readDonationAccess(cookies().get(DONATION_ACCESS_COOKIE)?.value)).includes(id);
}
export function paymentLocale(value: unknown) {
    return typeof value === 'string' && ['ar', 'en', 'fr', 'tr'].includes(value) ? value : 'tr';
}
