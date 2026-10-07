import { requirePermission, type StaffSession } from './admin-access';
import { hasPermission } from './permissions';
import { getSupabase } from './supabase';
export function canReadSensitive(session: StaffSession) { return hasPermission(session, 'messages.sensitive.view'); }
export async function requireMessageAccess(id: string, permission: 'messages.edit'|'messages.delete', req: Request) {
    const session = await requirePermission(permission, req, id);
    await requirePermission('messages.view', req, id);
    const { data, error } = await getSupabase().from('ContactMessage').select('id,isSensitive').eq('id', id).maybeSingle();
    if (error) throw new Error('Message lookup failed');
    if (!data) return null;
    if (data.isSensitive !== false) await requirePermission('messages.sensitive.view', req, id);
    return session;
}
