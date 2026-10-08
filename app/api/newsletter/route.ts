import {sendNewsletterWelcome} from '@/lib/mailer';
import {getSupabase} from '@/lib/supabase';
import {getRequestSite} from '@/lib/request-site';
import {newsletterToken} from '@/lib/newsletter-token';
import {NEWSLETTER_CONSENT_VERSION,newsletterConsentText} from '@/lib/newsletter-consent';
import {enforceRequestLimit} from '@/lib/request-limit';
import {NextRequest,NextResponse} from 'next/server';
export async function POST(req:NextRequest){
 const limited=await enforceRequestLimit(req,'newsletter');if(limited)return limited;
 try{const {email,marketingConsent,consentVersion,locale}=await req.json();
 if(typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))return NextResponse.json({error:'Invalid email address'},{status:400});
 if(marketingConsent!==true||consentVersion!==NEWSLETTER_CONSENT_VERSION)return NextResponse.json({error:'Please choose to receive newsletter emails.'},{status:400});
 const language=['ar','en','fr','tr'].includes(locale)?locale:'tr';
 await newsletterToken('configuration-check','configuration-check');
 const {data,error}=await getSupabase().rpc('subscribe_newsletter',{p_email:email.trim().toLowerCase(),p_locale:language,p_version:NEWSLETTER_CONSENT_VERSION,p_text:newsletterConsentText[language],p_source:'website-newsletter'});
 if(error||!data?.[0])return NextResponse.json({error:'Subscription could not be saved.'},{status:503});
 const token=await newsletterToken(data[0].id,data[0].unsubscribeKey);
 const url=getRequestSite().url+'/'+language+'/unsubscribe#token='+encodeURIComponent(token);
 // Durable subscription does not depend on the optional welcome email.
 try{await sendNewsletterWelcome(email.trim().toLowerCase(),url,language);}catch{}
 return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Service unavailable.'},{status:503});}
}