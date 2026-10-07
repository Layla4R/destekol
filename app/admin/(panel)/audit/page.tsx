import { requirePermission } from '@/lib/admin-access';
import { getSupabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function AuditPage() {
    try { await requirePermission('audit.view'); } catch { redirect('/admin/forbidden'); }
    const { data, error } = await getSupabase().from('AdminAuditLog').select('id,actorId,action,outcome,resourceId,createdAt').order('id', { ascending: false }).limit(200);
    return <div className="p-6 sm:p-8"><h1 className="text-2xl font-bold">Access &amp; Activity Log / سجل الوصول والإجراءات</h1><p className="mt-2 text-sm text-muted">Latest 200 events. Complaint contents, activation tokens and export contents are excluded.</p>{error ? <p className="mt-6">Audit log unavailable.</p> : <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-white"><table className="w-full text-left text-xs"><thead><tr>{['Time','Staff ID','Action','Result','Record ID'].map(t => <th className="border-b p-3" key={t}>{t}</th>)}</tr></thead><tbody>{data?.map(row => <tr key={row.id}>{[row.createdAt,row.actorId,row.action,row.outcome,row.resourceId || '—'].map((value,i) => <td key={i} className="border-b p-3">{value}</td>)}</tr>)}</tbody></table></div>}</div>;
}
