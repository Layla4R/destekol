# PayTR payment integration

Published default: DISABLED. No merchant keys, no live charge or refund was used in implementation tests.

## Enabled paths
- Owner-only payment settings in Admin > Settings: Disabled/Test/Live, encrypted credentials, approved currencies, card and bank service flags. AES-256-GCM key derives from the server session secret. Back up that secret; rotating it requires re-entering merchant secrets. Keys are never returned to clients. Each order stores an encrypted snapshot of its merchant credentials so later setting changes cannot break its callback or refund. Live activation requires explicit merchant approval/test confirmation.
- POST /api/payments/paytr/checkout saves parent donation plus all allocations atomically before requesting an iframe token. The server validates campaign availability/currency, frequency, amount, donor fields and acknowledgement of donation terms. Card requires phone and address per provider documentation. No card PAN/CVV enters our API or database.
- One request UUID and payload hash identify a checkout. Saved tokens are reused, parallel initial requests cannot start another token call, and ambiguous timeouts remain UNKNOWN with a protected status link. The browser retains only the hash and UUID across refreshes. Unknown outcomes never trigger automatic resubmission.
- POST /api/payments/paytr/callback is unauthenticated for the provider, verifies HMAC in constant time and checks amount/currency/test mode against the stored order. Card installments are disabled, so the signed total must equal the order amount. Duplicate notifications return exactly OK without crediting funds twice. A persistence error returns 503 so the provider can retry. Browser return URLs never confirm or cancel payments.
- Test callbacks update the private order state; donations stay PENDING and never increase campaign/user funds or produce an official receipt. The result page explicitly identifies a verified test payment.
- Successful live payments create a receipt reference, credit each campaign once, expose only session-authorized results and a protected PDF download, and remove paid allocation matches from the cart. Receipt email delivery is not part of callback processing; PDF download is available even without donor registration for the initiating guest session.
- Currency is an explicit unit, not an exchange-rate conversion. Campaign amounts and goals retain their stored currency. General donations can select merchant-approved currencies. Donor totals are stored and displayed separately per currency; reports filter by an explicit currency. The legacy totalDonated column is the USD subtotal, not a cross-currency sum. Bank transfers require TRY; USD campaign donations cannot silently become TRY. Mixed currencies/frequencies are not charged as a single order.
- Payment forms include links to use-of-donations, terms, refund/cancellation, privacy and KVKK policies, plus campaign details. Terms acknowledgement is recorded on the order; it is separate from newsletter consent.

## Refunds
Staff with donations.refund can submit a partial/full refund with amount and reason. A database reservation serializes requests, prevents over-refunding, and blocks another refund while a prior result is PENDING. A unique RF reference is sent to PayTR. Only a matching provider success is recorded as SUCCEEDED. Explicit rejection records FAILED. Timeouts/malformed responses/persistence errors stay PENDING for manual reconciliation in the merchant panel, with no automatic retry. Partial cart refunds distribute proportionally with cumulative-cent rounding; total allocations remain exact. Test refunds never affect live campaign totals.

## Merchant activation
1. Enter merchant credentials through owner settings; keep TEST mode first.
2. Configure notification URL https://destekol.org/api/payments/paytr/callback in PayTR merchant panel. Published deployment must have database service role/session secret variables for Functions runtime.
3. Authorize actual currencies and bank-transfer service. Never enable LIVE until test payment, callback delivery, duplicate notification and refund results have been checked in the merchant panel.
4. Set LIVE only after merchant approval. Disabling new payments does not disable processing outstanding authenticated callbacks or authorized refunds of existing transactions.

Monthly donations intentionally remain unavailable. The documented recurring service needs separate card-storage enrollment, explicit recurring authorization, Non3D/recurring permissions and an approved initial card-storage flow. The iframe card flow does not create a recurring subscription. Do not toggle monthly on or treat a one-time charge as recurring. Confirm the approved card-storage service with PayTR before implementing enrollment and scheduler; current cancellation endpoint correctly does not claim success for unavailable subscriptions.

## Verification
47 automated Node tests, database transactional tests in tests/paytr-checkout-ledger.sql, and production build/type checks. Tests mock gateway calls and use rollback/disposable fixtures; no live debit, refund, receipt email or merchant configuration change.

Official references:
- https://dev.paytr.com/iframe-api/iframe-api-1-adim
- https://dev.paytr.com/iframe-api/iframe-api-2-adim
- https://dev.paytr.com/havale-eft-iframe-api/havale-eft-iframe-api-1-adim
- https://dev.paytr.com/iade-api
- https://dev.paytr.com/direkt-api/kart-saklama-api/kayitli-kart-tekrarlayan-odeme
