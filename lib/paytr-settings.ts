import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {getSessionSecret} from './session-secret';
import {getSupabase} from './supabase';
export const PAYMENT_CURRENCIES=['USD','TRY','EUR','GBP','RUB'];
function key(){return createHash('sha256').update(getSessionSecret()).update('destekol-paytr-secrets-v1').digest();}
export function encryptPaymentSecret(value:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(),iv);const body=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return [iv,cipher.getAuthTag(),body].map(v=>v.toString('base64')).join('.');}
export function decryptPaymentSecret(value:string){const [iv,tag,body]=value.split('.').map(v=>Buffer.from(v,'base64'));const cipher=createDecipheriv('aes-256-gcm',key(),iv);cipher.setAuthTag(tag);return Buffer.concat([cipher.update(body),cipher.final()]).toString('utf8');}
export async function getPayTRSettings(){const {data,error}=await getSupabase().from('PayTRSettings').select('*').eq('id','default').single();if(error||!data)throw new Error('Payment configuration unavailable');return data;}
export function publicPaymentConfig(data:any){const configured=!!(data.merchantId&&data.merchantKeyEncrypted&&data.merchantSaltEncrypted);return {enabled:configured&&data.mode!=='DISABLED',testMode:data.mode==='TEST',card:configured&&data.mode!=='DISABLED'&&data.cardEnabled===true,bank:configured&&data.mode!=='DISABLED'&&data.bankEnabled===true,monthly:false,currencies:Array.isArray(data.currencies)?data.currencies.filter((v:string)=>PAYMENT_CURRENCIES.includes(v)):[]};}
export function payTRCredentials(data:any){if(!data.merchantId||!data.merchantKeyEncrypted||!data.merchantSaltEncrypted)throw new Error('Payment credentials unavailable');return {merchantId:data.merchantId,merchantKey:decryptPaymentSecret(data.merchantKeyEncrypted),merchantSalt:decryptPaymentSecret(data.merchantSaltEncrypted),testMode:data.mode==='TEST'};}
