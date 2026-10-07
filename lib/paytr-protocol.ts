import { createHmac, timingSafeEqual } from 'node:crypto';

export type PayTRMethod = 'CARD' | 'BANK_TRANSFER' | 'MONTHLY';
export const PAYTR_METHODS: readonly PayTRMethod[] = ['CARD', 'BANK_TRANSFER', 'MONTHLY'];
export interface PayTRCredentials { merchantId: string; merchantKey: string; merchantSalt: string; testMode: boolean }
export interface PayTROrder { id: string; ip: string; email: string; amount: number; currency: string; title: string }

function sign(value: string, credentials: PayTRCredentials) {
    return createHmac('sha256', credentials.merchantKey).update(value + credentials.merchantSalt).digest('base64');
}

// Server-side protocol preparation. Call only after merchant activation and after
// persisting a pending donation. Card and bank transfers have different amount units.
export function iframeFields(method: Exclude<PayTRMethod, 'MONTHLY'>, order: PayTROrder, credentials: PayTRCredentials) {
    if (method !== 'CARD' && method !== 'BANK_TRANSFER') throw new Error('Monthly donations require the recurring payment integration');
    const minor = Math.round(order.amount * 100);
    if (!Number.isFinite(order.amount) || order.amount <= 0 || !Number.isSafeInteger(minor) || Math.abs(minor - order.amount * 100) > 0.000001) throw new Error('Invalid amount');
    if (!/^[a-zA-Z0-9]{1,64}$/.test(order.id)) throw new Error('Invalid order reference');
    const currency = order.currency.toUpperCase() === 'TRY' ? 'TL' : order.currency.toUpperCase();
    if (!['TL', 'EUR', 'USD', 'GBP', 'RUB'].includes(currency)) throw new Error('Unsupported currency');
    if (method === 'BANK_TRANSFER' && currency !== 'TL') throw new Error('Bank transfers require TRY');
    const fields: Record<string, string> = { merchant_id: credentials.merchantId, user_ip: order.ip, merchant_oid: order.id, email: order.email, test_mode: credentials.testMode ? '1' : '0', debug_on: '0', timeout_limit: '30' };
    let hash = '';
    if (method === 'BANK_TRANSFER') {
        fields.payment_amount = order.amount.toFixed(2);
        fields.payment_type = 'eft';
        hash = fields.merchant_id + fields.user_ip + fields.merchant_oid + fields.email + fields.payment_amount + fields.payment_type + fields.test_mode;
    } else {
        fields.payment_amount = String(minor);
        fields.currency = currency;
        fields.user_basket = Buffer.from(JSON.stringify([[order.title, order.amount.toFixed(2), 1]])).toString('base64');
        fields.no_installment = '1';
        fields.max_installment = '0';
        hash = fields.merchant_id + fields.user_ip + fields.merchant_oid + fields.email + fields.payment_amount + fields.user_basket + fields.no_installment + fields.max_installment + fields.currency + fields.test_mode;
    }
    fields.paytr_token = sign(hash, credentials);
    return fields;
}

export function verifyPayTRCallback(oid: string, status: string, totalAmount: string, hash: string, credentials: PayTRCredentials) {
    if (!/^[a-zA-Z0-9]{1,64}$/.test(oid) || !['success', 'failed'].includes(status) || !/^\d+$/.test(totalAmount)) return false;
    const expected = createHmac('sha256', credentials.merchantKey).update(oid + credentials.merchantSalt + status + totalAmount).digest('base64');
    const a = Buffer.from(expected), b = Buffer.from(hash);
    return a.length === b.length && timingSafeEqual(a, b);
}
