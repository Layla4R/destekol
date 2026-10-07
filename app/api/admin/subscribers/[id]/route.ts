import { requirePermission, accessErrorResponse, auditAccess } from '@/lib/admin-access';
import { getSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
 try {
  const session = await requirePermission('subscribers.delete', req, params.id);
  const { error } = await getSupabase().from('Subscriber').delete().eq('id', params.id);
  await auditAccess(session, 'subscribers.delete', error ? 'FAILURE' : 'SUCCESS', params.id);
  return NextResponse.json(error ? { error: 'Delete failed' } : { ok: true }, { status: error ? 503 : 200 });
 } catch(error) { return accessErrorResponse(error); }
}
export async function POST(req: NextRequest, context: { params: { id: string } }) { const result = await DELETE(req, context); return result.ok ? NextResponse.redirect(new URL('/admin/subscribers',req.url),303) : result; }
