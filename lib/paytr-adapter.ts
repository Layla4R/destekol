import {createHmac} from 'node:crypto';
import {iframeFields,type PayTRCredentials,type PayTROrder} from './paytr-protocol';
export class GatewayRejected extends Error{}
async function post(url:string,fields:Record<string,string>){const response=await fetch(url,{method:'POST',body:new URLSearchParams(fields),cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('Payment service unavailable');return response.json();}
export async function requestPaymentToken(method:'CARD'|'BANK_TRANSFER',order:PayTROrder,credentials:PayTRCredentials,donor:{name:string;phone:string;address:string},returnUrl:string,locale:string,basket:[string,string,number][]){
 let fields=iframeFields(method,order,credentials);
 if(method==='CARD'){
  fields.user_basket=Buffer.from(JSON.stringify(basket)).toString('base64');
  const hash=fields.merchant_id+fields.user_ip+fields.merchant_oid+fields.email+fields.payment_amount+fields.user_basket+fields.no_installment+fields.max_installment+fields.currency+fields.test_mode+credentials.merchantSalt;
  fields.paytr_token=createHmac('sha256',credentials.merchantKey).update(hash).digest('base64');
  Object.assign(fields,{user_name:donor.name,user_phone:donor.phone,user_address:donor.address,merchant_ok_url:returnUrl,merchant_fail_url:returnUrl,lang:locale==='tr'?'tr':'en'});
 }
 const result=await post('https://www.paytr.com/odeme/api/get-token',fields);
 if(result.status==='failed')throw new GatewayRejected('Payment could not be started');
 if(result.status!=='success'||typeof result.token!=='string'||!/^[a-zA-Z0-9]{20,200}$/.test(result.token))throw new Error('Invalid gateway response');
 return result.token as string;
}
export async function requestRefund(oid:string,amount:number,reference:string,credentials:PayTRCredentials){
 const value=amount.toFixed(2),paytr_token=createHmac('sha256',credentials.merchantKey).update(credentials.merchantId+oid+value+credentials.merchantSalt).digest('base64');
 const result=await post('https://www.paytr.com/odeme/iade',{merchant_id:credentials.merchantId,merchant_oid:oid,return_amount:value,reference_no:reference,paytr_token});
 if(result.status==='error'||result.status==='failed')throw new GatewayRejected('Refund was rejected');
 if(result.status!=='success'||result.merchant_oid!==oid||Number(result.return_amount)!==amount||result.reference_no!==reference)throw new Error('Refund requires reconciliation');
 return {testMode:String(result.is_test)==='1'};
}
