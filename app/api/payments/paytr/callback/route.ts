import {NextRequest,NextResponse} from 'next/server';
import {getSupabase} from '@/lib/supabase';
import {getPayTRSettings,payTRCredentials} from '@/lib/paytr-settings';
import {verifyPayTRCallback} from '@/lib/paytr-protocol';
export async function POST(req:NextRequest){try{
 if(Number(req.headers.get('content-length')||0)>16384)return new NextResponse('Invalid callback',{status:400});
 const fields=await req.formData();const value=(k:string)=>typeof fields.get(k)==='string'?String(fields.get(k)):'';
 const oid=value('merchant_oid'),status=value('status'),total=value('total_amount');
 if(!/^[a-zA-Z0-9]{1,64}$/.test(oid))return new NextResponse('Invalid callback',{status:400});
 const db=getSupabase();const {data:order,error}=await db.from('PayTROrder').select('donationId,testMode,method,merchantId,merchantKeyEncrypted,merchantSaltEncrypted,donation:Donation(amount,currency)').eq('oid',oid).maybeSingle();
 if(error)throw error;if(!order)return new NextResponse('Unknown order',{status:404});
 const credentials=payTRCredentials(order.merchantKeyEncrypted&&order.merchantSaltEncrypted?order:await getPayTRSettings());if(!verifyPayTRCallback(oid,status,total,value('hash'),credentials))return new NextResponse('Invalid signature',{status:400});
 const donation:any=order.donation;const testMode=value('test_mode')==='1';const currency=order.method==='BANK_TRANSFER'?'TRY':value('currency').toUpperCase()==='TL'?'TRY':value('currency').toUpperCase();
 if(testMode!==order.testMode||currency!==String(donation.currency).toUpperCase()||!Number.isSafeInteger(Number(total))||Number(total)<0||(status==='success'&&(Number(total)!==Math.round(Number(donation.amount)*100)||(order.method==='CARD'&&Number(value('payment_amount'))!==Math.round(Number(donation.amount)*100)))))return new NextResponse('Payment mismatch',{status:400});
 const {error:saveError}=await db.rpc('process_paytr_callback',{p_oid:oid,p_status:status,p_amount:Number(total)/100,p_currency:currency,p_test:testMode});if(saveError)throw saveError;
 return new NextResponse('OK',{headers:{'Content-Type':'text/plain','Cache-Control':'no-store'}});
 }catch{return new NextResponse('Callback could not be persisted',{status:503});}}
