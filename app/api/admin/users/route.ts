import { requirePermission, accessErrorResponse } from '@/lib/admin-access';
import { getSupabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
export async function GET(req: Request) {
 const url = new URL(req.url);
 const donors = url.searchParams.get('role') === 'DONOR';
 try {
  const session = await requirePermission(donors ? 'users.view' : 'staff.manage', req);
  if (!donors && (session.role !== 'ADMIN' || session.isStaff)) return NextResponse.json({error:'Forbidden'},{status:403});
  let query = getSupabase().from('User').select('id,name,email,role,emailVerified,totalDonated,donationCount,createdAt,isStaff,permissions,isEvaluation,accessExpiresAt').order('createdAt',{ascending:false}).limit(2000);
  if (donors) query = query.eq('role','DONOR').eq('isStaff',false);
  const { data, error } = await query;
  if (error) return NextResponse.json({error:'User lookup failed'},{status:503});
  return NextResponse.json({users:data || [],truncated:(data?.length || 0)>=2000},{headers:{'Cache-Control':'no-store'}});
 } catch(error) { return accessErrorResponse(error); }
}
