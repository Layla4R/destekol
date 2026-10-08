"use client";
import Icon from '@/components/icons';
import { adminFetch } from '@/lib/admin-fetch';
import { CONTACT_STATUSES, contactStatusLabels } from '@/lib/contact-status';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
export default function MessageActions({id,isRead,email,status='RECEIVED',notificationStatus='UNKNOWN',canEdit=false,canDelete=false}:{id:string;isRead:boolean;email:string;status?:string;notificationStatus?:string;canEdit?:boolean;canDelete?:boolean}){
 const router=useRouter();const [loading,setLoading]=useState(false),[error,setError]=useState('');
 async function mutate(body:Record<string,unknown>|null){
  setLoading(true);setError('');
  try{const res=await adminFetch(`/api/admin/messages/${id}`,{method:body?'PATCH':'DELETE',...(body?{body:JSON.stringify(body)}:{})});
   if(!res.ok){setError(body?.retryNotification?'Email notification was not sent. The message remains saved.':'The change could not be saved.');}
   router.refresh();
  }catch{setError('Connection error. Please try again.');}finally{setLoading(false);}
 }
 return <div className="space-y-2 max-w-sm">
  <div className="flex flex-wrap items-center justify-end gap-2">
   <a href={`mailto:${email}`} className="text-xs border border-line rounded-lg px-3 py-2"><Icon name="mail" size={12}/> Reply</a>
   {canEdit&&<button disabled={loading} className="text-xs border border-line rounded-lg px-3 py-2" onClick={()=>mutate({isRead:!isRead})}>{isRead?'Mark unread':'Mark read'}</button>}
   {canDelete&&<button disabled={loading} className="text-danger border border-line rounded-lg px-3 py-2" onClick={()=>{if(confirm('Delete this message?'))void mutate(null)}}><Icon name="trash" size={14}/></button>}
  </div>
  {canEdit&&<label className="block text-xs text-muted">Request status
   <select aria-label="Request status" value={status} disabled={loading} onChange={e=>mutate({status:e.target.value})} className="block w-full border border-line rounded-lg p-2 mt-1 bg-white">
    {CONTACT_STATUSES.map(value=><option key={value} value={value}>{contactStatusLabels.en[value]}</option>)}
   </select>
  </label>}
  {canEdit&&notificationStatus!=='SENT'&&<button disabled={loading} onClick={()=>mutate({retryNotification:true})} className="text-xs text-brand underline">Retry email notification</button>}
  {error&&<p role="alert" className="text-xs text-danger">{error}</p>}
 </div>;
}
