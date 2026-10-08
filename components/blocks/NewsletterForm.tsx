"use client";
import {useState} from 'react';
import NewsletterChoice from '@/components/site/NewsletterChoice';
import {NEWSLETTER_CONSENT_VERSION} from '@/lib/newsletter-consent';
export default function NewsletterForm({locale='tr',buttonText,placeholder,successText}:{locale?:string;buttonText?:string;placeholder?:string;successText?:string}){
 const [email,setEmail]=useState(''),[consent,setConsent]=useState(false),[status,setStatus]=useState<'idle'|'sending'|'sent'|'error'>('idle');
 const t=(ar:string,en:string,fr:string,tr:string)=>locale==='ar'?ar:locale==='en'?en:locale==='fr'?fr:tr;
 async function submit(e:React.FormEvent){e.preventDefault();if(!consent)return;setStatus('sending');try{const response=await fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,locale,marketingConsent:consent,consentVersion:NEWSLETTER_CONSENT_VERSION})});const data=await response.json();setStatus(response.ok&&data.ok?'sent':'error');}catch{setStatus('error');}}
 return <form onSubmit={submit} className="newsletter-form max-w-md mx-auto space-y-5">
  <input required type="email" aria-label={t('البريد الإلكتروني','Email','E-mail','E-posta')} placeholder={placeholder||''} value={email} onChange={e=>setEmail(e.target.value)} className="newsletter-email w-full rounded-xl border border-line bg-white py-3 px-4 text-ink focus:outline-none focus:ring-2 focus:ring-brand/20"/>
  {status!=='sent'&&<NewsletterChoice locale={locale} checked={consent} onChange={setConsent}/>}
  {status==='error'&&<p role="alert" className="text-sm text-center">{t('تعذر حفظ الاشتراك. يرجى المحاولة لاحقًا.','Unable to save your subscription. Please try again later.','Impossible d’enregistrer votre inscription. Veuillez réessayer plus tard.','Aboneliğiniz kaydedilemedi. Lütfen daha sonra tekrar deneyin.')}</p>}
  <div className="flex justify-center pt-1"><button type="submit" disabled={status==='sending'||status==='sent'} className="newsletter-submit bg-accent-gradient text-white font-bold rounded-xl py-3 px-8 disabled:opacity-60 transition hover:opacity-90">{status==='sent'?successText||t('تم الاشتراك','Subscribed','Inscription réussie','Abone oldunuz'):status==='sending'?'…':buttonText||t('اشترك','Subscribe',"S’abonner",'Abone ol')}</button></div>
 </form>;
}
