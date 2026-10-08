"use client";
import { useEffect, useState } from 'react';
import { contactStatusLabels } from '@/lib/contact-status';

export default function ContactTracking({ locale }: {locale:string}) {
 const t=(ar:string,en:string,fr:string,tr:string)=>locale==='ar'?ar:locale==='fr'?fr:locale==='en'?en:tr;
 const [reference,setReference]=useState(''),[token,setToken]=useState('');
 const [loading,setLoading]=useState(false),[error,setError]=useState('');
 const [request,setRequest]=useState<{reference:string;status:string;createdAt:string;statusUpdatedAt:string}|null>(null);
 async function lookup(ref=reference,key=token){
  setLoading(true);setError('');setRequest(null);
  try{
   const response=await fetch('/api/contact/status',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({reference:ref.trim().toUpperCase(),token:key.trim()})});
   const data=await response.json();
   if(!response.ok)throw new Error(response.status===404?t('لم يُعثر على الطلب. تحقق من رقم الطلب ورمز المتابعة.','Request not found. Check the reference and tracking code.','Demande introuvable. Vérifiez la référence et le code de suivi.','Talep bulunamadı. Referans numarasını ve takip kodunu kontrol edin.'):t('تعذرت المتابعة الآن. يرجى المحاولة لاحقًا.','Unable to check right now. Please try again later.','Le suivi est indisponible. Veuillez réessayer plus tard.','Şu anda sorgulama yapılamıyor. Lütfen daha sonra tekrar deneyin.'));
   setRequest(data.request);
  }catch(e){setError(e instanceof Error?e.message:'Error');}finally{setLoading(false);}
 }
 useEffect(()=>{
  const params=new URLSearchParams(window.location.hash.slice(1));const ref=params.get('reference'),key=params.get('token');
  if(window.location.hash)window.history.replaceState(null,'',window.location.pathname+window.location.search);
  if(ref&&key){setReference(ref);setToken(key);void lookup(ref,key);}
 },[]);
 const input='w-full rounded-xl border border-line p-3 bg-white';
 return <section className="max-w-2xl mx-auto px-5 py-16">
  <h1 className="text-3xl font-bold text-ink mb-4">{t('متابعة الطلب','Track your request','Suivre votre demande','Talebinizi takip edin')}</h1>
  <p className="text-muted mb-7">{t('استخدم رابط المتابعة الخاص الذي حصلت عليه بعد إرسال الرسالة، أو أدخل رقم الطلب ورمز المتابعة.','Use the private tracking link provided after submission, or enter your reference and tracking code.','Utilisez le lien privé reçu après l’envoi, ou saisissez votre référence et votre code de suivi.','Mesajınızı gönderdikten sonra verilen özel takip bağlantısını kullanın veya referans numaranızı ve takip kodunuzu girin.')}</p>
  <form className="bg-white border border-line rounded-2xl p-6 space-y-4" onSubmit={e=>{e.preventDefault();void lookup();}}>
   <label className="block">{t('رقم الطلب','Request reference','Référence de la demande','Talep referans numarası')}<input required className={input} dir="ltr" value={reference} onChange={e=>setReference(e.target.value)} autoComplete="off"/></label>
   <label className="block">{t('رمز المتابعة الخاص','Private tracking code','Code de suivi privé','Özel takip kodu')}<input required type="password" className={input} dir="ltr" value={token} onChange={e=>setToken(e.target.value)} autoComplete="off"/></label>
   <button className="bg-brand text-white rounded-xl px-6 py-3 font-bold disabled:opacity-50" disabled={loading}>{loading?t('جارٍ التحقق…','Checking…','Vérification…','Sorgulanıyor…'):t('عرض الحالة','Check status','Consulter le statut','Durumu görüntüle')}</button>
  </form>
  {error&&<p role="alert" className="mt-5 text-danger">{error}</p>}
  {request&&<div role="status" className="mt-6 bg-white border border-line rounded-2xl p-6 space-y-3">
   <p dir="ltr" className="font-bold text-brand">{request.reference}</p>
   <p className="text-xl font-bold">{(contactStatusLabels[locale]||contactStatusLabels.tr)[request.status]}</p>
   <p className="text-muted">{t('آخر تحديث','Last updated','Dernière mise à jour','Son güncelleme')}: {new Date(request.statusUpdatedAt).toLocaleString(locale)}</p>
  </div>}
 </section>;
}
