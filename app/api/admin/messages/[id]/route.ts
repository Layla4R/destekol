import { notifyContact } from '@/lib/contact-notifications';
import { requireMessageAccess } from '@/lib/message-access';
import { accessErrorResponse, auditAccess } from '@/lib/admin-access';
import { getSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
async function mutate(req: NextRequest, id: string, remove: boolean) {
 try {
  const action = remove ? 'messages.delete' : 'messages.edit';
  const session = await requireMessageAccess(id, action, req);
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const db = getSupabase();
  let query;
  if (remove) query = db.from('ContactMessage').delete().eq('id', id);
  else {
   const body=await req.json();
   if(body.retryNotification===true){
    const notificationStatus=await notifyContact(id,true);
    await auditAccess(session,'messages.notification.retry',notificationStatus==='SENT'?'SUCCESS':'FAILURE',id);
    return NextResponse.json({ok:notificationStatus==='SENT',notificationStatus},{status:notificationStatus==='SENT'?200:503});
   }
   const update: Record<string,unknown>={};
   if(body.isRead!==undefined){if(typeof body.isRead!=='boolean')return NextResponse.json({error:'Invalid read status'},{status:400});update.isRead=body.isRead;}
   if(body.status!==undefined){if(!['RECEIVED','IN_PROGRESS','ANSWERED','CLOSED'].includes(body.status))return NextResponse.json({error:'Invalid status'},{status:400});update.status=body.status;update.statusUpdatedAt=new Date().toISOString();}
   if(!Object.keys(update).length)return NextResponse.json({error:'Nothing to update'},{status:400});
   query=db.from('ContactMessage').update(update).eq('id',id);
  }
  const { error } = await query;
  await auditAccess(session, action, error ? 'FAILURE' : 'SUCCESS', id);
  return NextResponse.json(error ? { error: 'Operation failed' } : { ok: true }, { status: error ? 503 : 200 });
 } catch (error) { return accessErrorResponse(error); }
}
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) { return mutate(req, params.id, false); }
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) { return mutate(req, params.id, true); }
