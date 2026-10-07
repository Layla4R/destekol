import { requireSuperAdmin } from '@/lib/auth';
import { requirePermission, accessErrorResponse, auditAccess, AccessError } from '@/lib/admin-access';
import { ALL_PERMISSIONS } from '@/lib/permissions';
import { getSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
async function authorize(req: Request, id: string) {
 const session=await requirePermission('staff.manage',req,id);
 if (session.role !== 'ADMIN' || session.isStaff) throw new AccessError(403);
 await requireSuperAdmin(req);
 return session;
}
export async function PATCH(req: NextRequest, {params}: {params:{id:string}}) {
 try {
  const session=await authorize(req,params.id);
  const body=await req.json();
  if (body.role !== undefined && !['DONOR','EDITOR','ADMIN','VIEWER','FINANCE','COMPLAINTS'].includes(body.role)) return NextResponse.json({error:'Invalid role'},{status:400});
  if (body.isStaff !== undefined && typeof body.isStaff !== 'boolean') return NextResponse.json({error:'Invalid staff flag'},{status:400});
  if (body.permissions !== undefined && (!Array.isArray(body.permissions) || body.permissions.some((p:unknown)=>typeof p!=='string' || !ALL_PERMISSIONS.some(x=>x.id===p)))) return NextResponse.json({error:'Invalid permissions'},{status:400});
  if (params.id===session.id) return NextResponse.json({error:'Cannot change your own access'},{status:403});
  const db=getSupabase(); const {data:target}=await db.from('User').select('id,role,isStaff').eq('id',params.id).maybeSingle();
  if (!target) return NextResponse.json({error:'Not found'},{status:404});
  if (target.role==='ADMIN' && !target.isStaff) return NextResponse.json({error:'Owner access cannot be edited here'},{status:403});
  const data: Record<string,unknown>={};
  if(body.role!==undefined)data.role=body.role;
  if(body.isStaff!==undefined)data.isStaff=body.isStaff;
  if(body.permissions!==undefined)data.permissions=[...new Set(body.permissions)];
  if(!Object.keys(data).length)return NextResponse.json({error:'Nothing to update'},{status:400});
  if(body.role && body.role!=='DONOR')data.isStaff=true;
  if(body.role==='DONOR'){data.isStaff=false;data.permissions=[];}
  const {error}=await db.from('User').update(data).eq('id',params.id);
  await auditAccess(session,'staff.manage.update',error?'FAILURE':'SUCCESS',params.id);
  return NextResponse.json(error?{error:'Update failed'}:{ok:true},{status:error?503:200});
 }catch(error){return accessErrorResponse(error);}
}
export async function DELETE(req:NextRequest,{params}:{params:{id:string}}){
 try{
  const session=await authorize(req,params.id);const db=getSupabase();
  const {data:target}=await db.from('User').select('role').eq('id',params.id).maybeSingle();
  if(!target)return NextResponse.json({error:'Not found'},{status:404});
  if(target.role==='ADMIN')return NextResponse.json({error:'Cannot delete admin users'},{status:403});
  const {error:sessionsError}=await db.from('DonorSession').delete().eq('userId',params.id);
  if(sessionsError)return NextResponse.json({error:'Session removal failed'},{status:503});
  const {error}=await db.from('User').delete().eq('id',params.id);
  await auditAccess(session,'staff.manage.delete',error?'FAILURE':'SUCCESS',params.id);
  return NextResponse.json(error?{error:'Delete failed'}:{ok:true},{status:error?503:200});
 }catch(error){return accessErrorResponse(error);}
}
