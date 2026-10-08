import {NextResponse} from 'next/server';
import {getPayTRSettings,publicPaymentConfig} from '@/lib/paytr-settings';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json(publicPaymentConfig(await getPayTRSettings()),{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({enabled:false,card:false,bank:false,monthly:false,currencies:[]},{headers:{'Cache-Control':'no-store'}});}}
