import {NextRequest,NextResponse} from 'next/server';
import {enforceRequestLimit} from '@/lib/request-limit';
import {verifyNewsletterToken} from '@/lib/newsletter-token';
import {getSupabase} from '@/lib/supabase';
export async function POST(req:NextRequest){
 const limited=await enforceRequestLimit(req,'newsletter-unsubscribe');if(limited)return limited;
 let identity;try{const {token}=await req.json();if(typeof token!=='string'||token.length>4096)throw new Error();identity=await verifyNewsletterToken(token);}catch{return NextResponse.json({error:'Invalid cancellation link.'},{status:400});}
 try{const {data,error}=await getSupabase().rpc('unsubscribe_newsletter',{p_id:identity.id,p_key:identity.key});
 if(error)return NextResponse.json({error:'Cancellation could not be saved.'},{status:503});
 if(data!==true)return NextResponse.json({error:'Invalid cancellation link.'},{status:400});
 return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Service unavailable.'},{status:503});}
}