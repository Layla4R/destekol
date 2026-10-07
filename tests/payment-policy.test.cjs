const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
    const mod = { exports: {} };
    new Function('require', 'module', 'exports', 'React', compiled)(name => name in mocks ? mocks[name] : require(name), mod, mod.exports, React);
    return mod.exports;
}
const lifecycle = load('lib/payment-lifecycle.ts');
const paytr = load('lib/paytr-protocol.ts');
test('PayTR separates amount units and rejects invalid requests and callbacks', () => {
    const { createHmac } = require('node:crypto');
    const credentials = { merchantId: '123', merchantKey: 'test-key', merchantSalt: 'test-salt', testMode: true };
    const order = { id: 'DO123', ip: '203.0.113.1', email: 'test@example.com', amount: 19.99, currency: 'TRY', title: 'Donation' };
    const card = paytr.iframeFields('CARD', order, credentials);
    const bank = paytr.iframeFields('BANK_TRANSFER', order, credentials);
    assert.equal(card.payment_amount, '1999');
    assert.equal(card.currency, 'TL');
    assert.equal(bank.payment_amount, '19.99');
    assert.equal(bank.payment_type, 'eft');
    assert.equal(card.no_installment, '1');
    const expectedBank = createHmac('sha256', credentials.merchantKey).update('123203.0.113.1DO123test@example.com19.99eft1test-salt').digest('base64');
    assert.equal(bank.paytr_token, expectedBank);
    assert.throws(() => paytr.iframeFields('BANK_TRANSFER', { ...order, currency: 'USD' }, credentials));
    assert.throws(() => paytr.iframeFields('MONTHLY', order, credentials));
    assert.throws(() => paytr.iframeFields('CARD', { ...order, amount: 0.001 }, credentials));
    const hash = createHmac('sha256', credentials.merchantKey).update('DO123test-saltsuccess1999').digest('base64');
    assert.equal(paytr.verifyPayTRCallback('DO123', 'success', '1999', hash, credentials), true);
    assert.equal(paytr.verifyPayTRCallback('DO123', 'success', '1998', hash, credentials), false);
    assert.equal(paytr.verifyPayTRCallback('DO123', 'success', '1999', 'bad', credentials), false);
});
const consent = load('lib/cookie-consent.ts');

test('amount and currency must both match a confirmed payment', () => {
    assert.equal(lifecycle.paymentAmountsMatch(10, 10, 'usd', 'USD'), true);
    assert.equal(lifecycle.paymentAmountsMatch(10, 1, 'usd', 'USD'), false);
    assert.equal(lifecycle.paymentAmountsMatch(10, 10, 'usd', 'EUR'), false);
    assert.equal(lifecycle.paymentAmountsMatch(10, NaN, 'usd', 'USD'), false);
    assert.equal(lifecycle.refundState(100, 30), 'PARTIAL');
    assert.equal(lifecycle.refundState(100, 100), 'FULL');
    assert.throws(() => lifecycle.refundState(100, 101));
    for (const amount of [0, -1, NaN, Infinity, 0.001, Number.MAX_VALUE]) assert.equal(lifecycle.validDonationAmount(amount), false);
    assert.equal(lifecycle.validDonationAmount(19.99), true);
});


test('no tracker loads for absent, legacy, rejected or malformed consent', () => {
    for (const value of [null, 'accepted', 'rejected', '{}', '{"version":2,"analytics":true}']) {
        const parsed = consent.parseConsent(value);
        for (const provider of ['ga', 'gtm', 'meta']) assert.equal(consent.trackingAllowed(parsed, provider), false);
    }
    const analytics = { version: 2, updatedAt: '2026-10-07', analytics: true, marketing: false, functional: false };
    assert.equal(consent.trackingAllowed(analytics, 'ga'), true);
    assert.equal(consent.trackingAllowed(analytics, 'gtm'), false);
    assert.equal(consent.trackingAllowed(analytics, 'meta'), false);
});

function pageFixture({ guest = false, donor = null, donation = null } = {}) {
    const filters = [];
    let queries = 0;
    const query = { select() { return this; }, eq(key, value) { filters.push([key, value]); return this; }, async maybeSingle() { return { data: donation, error: null }; } };
    const page = load('app/[locale]/donate/success/page.tsx', {
        '@/lib/donorAuth': { getCurrentDonor: async () => donor },
        '@/lib/donation-return-access': { hasDonationReturnAccess: async () => guest },
        '@/lib/supabase': { getSupabaseOrNull: () => ({ from() { queries++; return query; } }) },
        'next/link': props => React.createElement('a', props),
        './PaymentResultActions': () => null,
    }).default;
    return { page, filters, queries: () => queries };
}
test('opening a return page directly or with an unauthorized id exposes no payment details', async () => {
    const fixture = pageFixture({ donation: { status: 'COMPLETED', receiptNumber: 'PRIVATE-RECEIPT' } });
    for (const searchParams of [{}, { donation: 'another-donation' }]) {
        const html = renderToStaticMarkup(await fixture.page({ params: { locale: 'ar' }, searchParams }));
        assert.ok(html.includes('الدفع قيد التحقق'));
        assert.ok(!html.includes('PRIVATE-RECEIPT'));
        assert.equal(fixture.queries(), 0);
    }
});
test('owner queries are restricted by email and pending payments never claim success', async () => {
    const fixture = pageFixture({ donor: { email: 'owner@example.test' }, donation: { status: 'PENDING' } });
    const html = renderToStaticMarkup(await fixture.page({ params: { locale: 'en' }, searchParams: { donation: 'd1' } }));
    assert.ok(fixture.filters.some(([key, value]) => key === 'donorEmail' && value === 'owner@example.test'));
    assert.ok(html.includes('Payment verification pending'));
    assert.ok(!html.includes('Your donation is confirmed'));
});
test('a verified guest sees confirmed details in the transaction currency', async () => {
    const fixture = pageFixture({ guest: true, donation: { status: 'COMPLETED', amount: 10, currency: 'eur', receiptNumber: 'VALID-RECEIPT', campaignId: 'c1', frequency: 'ONE_TIME' } });
    const html = renderToStaticMarkup(await fixture.page({ params: { locale: 'en' }, searchParams: { donation: 'd1' } }));
    assert.ok(html.includes('Your donation is confirmed'));
    assert.ok(html.includes('VALID-RECEIPT'));
    assert.ok(html.includes('€'));
});

test('a cancellation return URL cannot alter transaction status', () => {
    const source = fs.readFileSync(path.join(__dirname, '../app/[locale]/donate/cancel/page.tsx'), 'utf8');
    assert.ok(!source.includes('.update('));
});
test('guest access cookies are scoped, signed and unavailable to JavaScript', async () => {
    const access = load('lib/donation-return-access.ts', {
        'next/headers': { cookies: () => ({ get: () => null }) },
        './session-secret': { getSessionSecret: () => new Uint8Array(32).fill(7) },
        './request-site': { getRequestSite: () => ({ id: 'destekol' }) },
    });
    let saved;
    const response = { cookies: { set: (...args) => { saved = args; } } };
    await access.grantDonationAccess(response, 'donation-1');
    assert.equal(saved[2].httpOnly, true);
    assert.equal(saved[2].sameSite, 'lax');
    assert.equal(saved[2].maxAge, 7200);
    assert.deepEqual(await access.readDonationAccess(saved[1]), ['donation-1']);
    const parts = saved[1].split('.');
    parts[1] = Buffer.from(JSON.stringify({ purpose: 'donation-return', site: 'destekol', donations: ['another-donation'] })).toString('base64url');
    assert.deepEqual(await access.readDonationAccess(parts.join('.')), []);
    assert.deepEqual(await access.readDonationAccess('invalid'), []);
});
