import {NextRequest,NextResponse} from 'next/server';
import {createHash,randomUUID} from 'node:crypto';
import {getSupabase} from '@/lib/supabase';
import {getRequestSite} from '@/lib/request-site';
import {getPayTRSettings,publicPaymentConfig,payTRCredentials,encryptPaymentSecret,decryptPaymentSecret} from '@/lib/paytr-settings';
import {requestPaymentToken,GatewayRejected} from '@/lib/paytr-adapter';
import {validDonationAmount} from '@/lib/payment-lifecycle';
import {enforceRequestLimit,clientIdentity} from '@/lib/request-limit';
import {grantDonationAccess,DONATION_ACCESS_COOKIE,paymentLocale} from '@/lib/donation-return-access';
export async function POST(req:NextRequest){
 let requestedLocale='tr';
 const limited=await enforceRequestLimit(req,'payment-checkout');if(limited)return limited;
 let order:any=null;
 try{const settings=await getPayTRSettings(),config=publicPaymentConfig(settings);if(!config.enabled)return NextResponse.json({error:'PAYMENTS_UNAVAILABLE'},{status:503});
 const body=await req.json();const {name,email,phone,address,method,requestKey,items,policiesAccepted}=body;
 const currency=typeof body.currency==='string'?body.currency.toUpperCase():'';const locale=paymentLocale(body.locale);requestedLocale=locale;
 if(!config.currencies.includes(currency)||!['CARD','BANK_TRANSFER'].includes(method)||!(method==='CARD'?config.card:config.bank)||(method==='BANK_TRANSFER'&&currency!=='TRY'))return NextResponse.json({error:'METHOD_UNAVAILABLE'},{status:400});
 if(policiesAccepted!==true||typeof requestKey!=='string'||!/^[a-f0-9-]{36}$/i.test(requestKey)||typeof name!=='string'||name.trim().length<2||name.length>60||typeof email!=='string'||email.length>100||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())||!Array.isArray(items)||items.length<1||items.length>50||items.some(i=>!i||!validDonationAmount(i.amount)||i.amount>1000000||i.frequency!=='ONE_TIME'||!(i.campaignId===null||typeof i.campaignId==='string'))||(method==='CARD'&&(typeof phone!=='string'||!/^\+?[0-9 ()-]{7,20}$/.test(phone)||typeof address!=='string'||address.trim().length<5||address.length>400)))return NextResponse.json({error:'INVALID_DONATION'},{status:400});
 const ip=clientIdentity(req.headers);if(ip==='shared-unknown-client')return NextResponse.json({error:'PAYMENT_IP_UNAVAILABLE'},{status:503});
 const normalized={name:name.trim(),email:email.trim().toLowerCase(),phone:phone||'',address:address||'',method,currency,items:items.map(i=>({campaignId:i.campaignId,amount:i.amount,frequency:i.frequency})),locale,message:typeof body.message==='string'?body.message.slice(0,2000):'',anonymous:body.anonymous===true};
 const db=getSupabase();const ids=[...new Set(normalized.items.map(i=>i.campaignId).filter(Boolean))];
 const campaigns=ids.length?(await db.from('Campaign').select('id,title,slug,currency,isActive,endDate').in('id',ids)).data||[]:[];
 if(ids.some(id=>!campaigns.some(c=>c.id===id&&c.isActive&&c.currency===currency&&(!c.endDate||new Date(c.endDate)>new Date()))))return NextResponse.json({error:'CAMPAIGN_UNAVAILABLE'},{status:400});
 const hash=createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
 const {data,error}=await db.rpc('create_paytr_order',{p_key:requestKey,p_hash:hash,p_oid:'DO'+randomUUID().replaceAll('-',''),p_name:normalized.name,p_email:normalized.email,p_currency:currency,p_items:normalized.items,p_method:method,p_test:config.testMode,p_message:normalized.message,p_anonymous:normalized.anonymous});
 if(error||!data?.[0])return NextResponse.json({error:'ORDER_SAVE_FAILED'},{status:503});order=data[0];
 const returnUrl=getRequestSite().url+'/'+locale+'/donate/success?donation='+order.donationId;
 if(!order.created){const {data:previous}=await db.from('PayTROrder').select('testMode,callbackStatus').eq('donationId',order.donationId).single();if(previous?.callbackStatus){const response=NextResponse.json({ok:true,returnUrl,testMode:previous.testMode},{headers:{'Cache-Control':'no-store'}});return await grantDonationAccess(response,order.donationId,req.cookies.get(DONATION_ACCESS_COOKIE)?.value);}if(!previous||previous.testMode!==config.testMode||order.tokenState!=='READY'){const response=NextResponse.json({error:'ORDER_PENDING',returnUrl},{status:409});return await grantDonationAccess(response,order.donationId,req.cookies.get(DONATION_ACCESS_COOKIE)?.value);}}
 let token=order.iframeTokenEncrypted?decryptPaymentSecret(order.iframeTokenEncrypted):'';
 if(order.created){const {error:snapshotError}=await db.from('PayTROrder').update({merchantId:settings.merchantId,merchantKeyEncrypted:settings.merchantKeyEncrypted,merchantSaltEncrypted:settings.merchantSaltEncrypted}).eq('donationId',order.donationId);if(snapshotError)throw new Error('Credential snapshot failed');const total=normalized.items.reduce((sum,i)=>sum+Math.round(i.amount*100),0)/100;const basket=normalized.items.map(i=>[campaigns.find(c=>c.id===i.campaignId)?.title||'General donation',i.amount.toFixed(2),1] as [string,string,number]);
 token=await requestPaymentToken(method,{id:order.oid,ip,email:normalized.email,amount:total,currency,title:'Donation'},payTRCredentials(settings),{name:normalized.name,phone:normalized.phone,address:normalized.address},returnUrl,locale,basket);
 const {error:saveError}=await db.from('PayTROrder').update({tokenState:'READY',iframeTokenEncrypted:encryptPaymentSecret(token)}).eq('donationId',order.donationId);if(saveError)throw new Error('Token save failed');}
 const response=NextResponse.json({ok:true,donationId:order.donationId,iframeUrl:'https://www.paytr.com/odeme/guvenli/'+token,returnUrl,testMode:config.testMode,currency,amount:normalized.items.reduce((sum,i)=>sum+Math.round(i.amount*100),0)/100},{headers:{'Cache-Control':'no-store'}});
 return await grantDonationAccess(response,order.donationId,req.cookies.get(DONATION_ACCESS_COOKIE)?.value);
 }catch(error){if(order?.created){try{await getSupabase().from('PayTROrder').update({tokenState:error instanceof GatewayRejected?'FAILED':'UNKNOWN'}).eq('donationId',order.donationId);if(error instanceof GatewayRejected)await getSupabase().from('Donation').update({status:'FAILED'}).eq('id',order.donationId).eq('status','PENDING');}catch{}}
 const response=NextResponse.json({error:error instanceof GatewayRejected?'PAYMENT_REJECTED':'PAYMENT_START_UNCERTAIN',...(order?{returnUrl:getRequestSite().url+'/'+requestedLocale+'/donate/success?donation='+order.donationId}:{})},{status:503});
 if(order){try{return await grantDonationAccess(response,order.donationId,req.cookies.get(DONATION_ACCESS_COOKIE)?.value);}catch{}}return response;}
}
