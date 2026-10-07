import { NextResponse } from 'next/server';
import { getAdminSession } from './auth';
import { hasPermission, type PermissionId } from './permissions';
import { getSupabase } from './supabase';
import { getRequestSite } from './request-site';
import { adminApiPolicy, adminPagePolicy } from './admin-policy';
export type StaffSession = NonNullable<Awaited<ReturnType<typeof getAdminSession>>>;
export class AccessError extends Error { constructor(public status: number) { super(status === 401 ? 'Unauthorized' : status === 403 ? 'Forbidden' : 'Audit service unavailable'); } }
// Do not store request bodies, search terms, email addresses, tokens or complaint contents.
export async function auditAccess(session: StaffSession, action: string, outcome: 'ALLOW'|'DENY'|'SUCCESS'|'FAILURE', resourceId?: string) {
    const { error } = await getSupabase().from('AdminAuditLog').insert({ actorId: session.id, action, outcome, resourceId: resourceId || null, site: getRequestSite().id });
    if (error) throw new AccessError(503);
}
export async function requirePermission(permission: PermissionId, req?: { headers: { get: (name: string) => string | null } }, resourceId?: string) {
    const session = await getAdminSession(req);
    if (!session) throw new AccessError(401);
    const allowed = hasPermission(session, permission);
    await auditAccess(session, permission, allowed ? 'ALLOW' : 'DENY', resourceId);
    if (!allowed) throw new AccessError(403);
    return session;
}
export async function requireRoutePermission(req: Request) {
    const policy = adminApiPolicy(new URL(req.url).pathname, req.method);
    if (!policy) throw new AccessError(403);
    const session = await requirePermission(policy.permission, req);
    if (policy.ownerOnly && (session.role !== 'ADMIN' || session.isStaff)) { await auditAccess(session, policy.permission, 'DENY'); throw new AccessError(403); }
    return session;
}
export async function requirePagePermission(path: string) {
    if (path === '/admin/forbidden') { const session = await getAdminSession(); if (!session) throw new AccessError(401); return session; }
    const policy = adminPagePolicy(path);
    if (!policy) throw new AccessError(403);
    const session = await requirePermission(policy.permission);
    if (policy.ownerOnly && (session.role !== 'ADMIN' || session.isStaff)) { await auditAccess(session, policy.permission, 'DENY'); throw new AccessError(403); }
    return session;
}
export function accessErrorResponse(error: unknown) { const status = error instanceof AccessError ? error.status : error instanceof Error && error.message === 'UNAUTHORIZED' ? 403 : 503; return NextResponse.json({ error: status === 401 ? 'Unauthorized' : status === 403 ? 'Forbidden' : 'Service unavailable' }, { status, headers: { 'Cache-Control': 'no-store' } }); }
