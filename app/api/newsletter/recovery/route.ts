import {NextRequest,NextResponse} from 'next/server';
import {enforceRequestLimit} from '@/lib/request-limit';
import {newsletterToken} from '@/lib/newsletter-token';
import {getSupabase} from '@/lib/supabase';
import {getRequestSite} from '@/lib/request-site';
import {sendMail} from '@/lib/mailer';
export async function POST(req:NextRequest){
 const limited=await enforceRequestLimit(req,'newsletter-recovery');if(limited)return limited;
 try{const {email,locale}=await req.json();if(typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))return NextResponse.json({error:'Invalid email.'},{status:400});
 const language=['ar','en','fr','tr'].includes(locale)?locale:'tr';
 const {data,error}=await getSupabase().from('Subscriber').select('id,unsubscribeKey').eq('email',email.trim().toLowerCase()).maybeSingle();
 if(error)return NextResponse.json({error:'Service unavailable.'},{status:503});
 if(data){const token=await newsletterToken(data.id,data.unsubscribeKey);const url=getRequestSite().url+'/'+language+'/unsubscribe#token='+encodeURIComponent(token);
 const label=language==='ar'?'إلغاء الاشتراك':language==='fr'?'Se désabonner':language==='en'?'Unsubscribe':'Aboneliği iptal et';
 const sent=await sendMail({to:email.trim().toLowerCase(),subject:'Destekol — '+label,html:'<p><a href="'+url+'">'+label+'</a></p>',timeoutMs:8000});if(!sent)return NextResponse.json({error:'Email could not be sent.'},{status:503});}
 return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Service unavailable.'},{status:503});}
}