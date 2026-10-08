import {NextRequest,NextResponse} from 'next/server';
import {requirePermission,accessErrorResponse,auditAccess} from '@/lib/admin-access';
import {getSupabase} from '@/lib/supabase';
import {getPayTRSettings,payTRCredentials} from '@/lib/paytr-settings';
import {requestRefund,GatewayRejected} from '@/lib/paytr-adapter';
import {validDonationAmount} from '@/lib/payment-lifecycle';
export async function POST(req:NextRequest,{params}:{params:{id:string}}){
 let session;try{session=await requirePermission('donations.refund',req,params.id);}catch(e){return accessErrorResponse(e);}
 try{const {amount,reason,requestKey}=await req.json();if(!validDonationAmount(amount)||typeof reason!=='string'||!reason.trim()||reason.length>1000||typeof requestKey!=='string'||!/^[a-f0-9-]{36}$/i.test(requestKey))return NextResponse.json({error:'Amount, reason and unique reference required.'},{status:400});
 const db=getSupabase();
 const {data:order,error}=await db.from('PayTROrder').select('oid,testMode,merchantId,merchantKeyEncrypted,merchantSaltEncrypted').eq('donationId',params.id).maybeSingle();if(error)throw error;if(!order)return NextResponse.json({error:'Transaction not found'},{status:404});const credentials=payTRCredentials(order.merchantKeyEncrypted&&order.merchantSaltEncrypted?order:await getPayTRSettings());credentials.testMode=order.testMode;
 const reference='RF'+requestKey.replaceAll('-','');
 await auditAccess(session,'donations.refund.request','ALLOW',params.id);
 const {error:reserveError}=await db.rpc('reserve_paytr_refund',{p_id:params.id,p_ref:reference,p_amount:amount,p_reason:reason.trim()});if(reserveError)return NextResponse.json({error:'Refund already exists, is pending, or exceeds the remaining amount.'},{status:409});
 let result;try{result=await requestRefund(order.oid,amount,reference,credentials);}catch(e){if(e instanceof GatewayRejected){const {error:saveError}=await db.rpc('finish_paytr_refund',{p_id:params.id,p_ref:reference,p_status:'FAILED'});if(!saveError){await auditAccess(session,'donations.refund.request','FAILURE',params.id);return NextResponse.json({error:'Provider rejected the refund.',reference},{status:502});}}
 await auditAccess(session,'donations.refund.reconciliation','FAILURE');return NextResponse.json({error:'Refund result is uncertain. Reconcile this reference in the merchant panel before making another request.',reference,status:'PENDING'},{status:202});}
 if(result.testMode!==order.testMode)return NextResponse.json({error:'Refund requires reconciliation',reference,status:'PENDING'},{status:202});
 const {error:saveError}=await db.rpc('finish_paytr_refund',{p_id:params.id,p_ref:reference,p_status:'SUCCEEDED'});if(saveError)return NextResponse.json({error:'Provider accepted the refund; local recording requires reconciliation. Do not submit it again.',reference,status:'PENDING'},{status:202});
 await auditAccess(session,'donations.refund.request','SUCCESS',params.id);return NextResponse.json({ok:true,reference,status:'SUCCEEDED'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return accessErrorResponse(e);}}
