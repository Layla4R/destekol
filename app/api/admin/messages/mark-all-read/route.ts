import { requirePermission, accessErrorResponse, auditAccess } from '@/lib/admin-access';
import { canReadSensitive } from '@/lib/message-access';
import { getSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
 try {
  const session = await requirePermission('messages.edit', req);
  await requirePermission('messages.view', req);
  let query = getSupabase().from('ContactMessage').update({ isRead: true }).eq('isRead', false);
  if (!canReadSensitive(session)) query = query.eq('isSensitive', false);
  const { error } = await query;
  await auditAccess(session, 'messages.edit.bulk', error ? 'FAILURE' : 'SUCCESS');
  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 503 });
  if (req.headers.get('accept')?.includes('text/html')) return NextResponse.redirect(new URL('/admin/messages', req.url), 303);
  return NextResponse.json({ ok: true });
 } catch (error) { return accessErrorResponse(error); }
}
