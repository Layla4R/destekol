# Monthly donations — preparation before gateway approval

Status: **prepared public disclosure and validation contracts; recurring service remains unavailable**. No subscription, standing authorization, card token, scheduled charge or recurring payment job is created by the current site.

## Implemented

- Four-language monthly disclosure on the shared checkout used by donation/cart/widgets: amount and currency per month; proposed monthly continuation until cancellation; first charge date explicitly pending approval; separate recurring authorization; cancellation route/contact; effective cancellation versus refund distinction.
- Donation summary and disabled monthly button identify the amount as monthly.
- No recurring consent checkbox is collected before approved terms exist; choosing the monthly tab is not authorization.
- Provider-independent authorization record builder requires exact version acceptance, amount/currency, explicit first-charge timestamp/timezone, schedule, cancellation terms and provider/cancellation-test approval. It returns a snapshot for future persistence; it is **not connected to a storage table or an enrollment endpoint**.
- Provider-independent cancellation decision refuses to report confirmed cancellation without a provider reference and effective date. Cancellation never changes refund/payment amounts. This helper is **not yet connected to a provider adapter or persistence**.
- Cancellation API checks a current donor session and restricts lookup to the donor’s email. Unknown/nonmonthly records are not disclosed; unavailable service returns 503 and never updates a subscription or payment locally.
- Existing checkout API rejects monthly requests; configuring one-time payment credentials cannot enable recurring payments.

## What must happen after provider approval

1. Obtain the approved recurring/card-storage service, currencies and cancellation behavior. PayTR’s stored-card recurring service requires approved Non3D capability and an application-managed charge schedule: https://dev.paytr.com/direkt-api/kart-saklama-api/kayitli-kart-tekrarlayan-odeme
2. Implement approved card enrollment/token storage, durable subscription/authorization records, first/next charge schedule and scheduler locking/idempotency. Use provider tokens only; do not store card numbers or CVV.
3. Replace proposed public wording with exact first-charge date, cadence/timezone, continuation and cancellation effective-time rules before collecting consent. Persist the exact displayed terms/version and server timestamp.
4. Connect the cancellation adapter and durable request/confirmation states; stop future scheduler work and reconcile charges already in flight. Provide verified access for guest donors before enabling guest subscriptions.
5. Test enrollment, successful/failed first and subsequent charges, month-end scheduling, retries without duplicate charges, unavailable provider, cancellation confirmation/failure/timeout, and refund independence in provider test mode. Only then enable recurring checkout.

## Current verification

Unit tests cover the disclosure in all four languages; missing/stale consent or terms; unconfirmed versus confirmed cancellation decisions; anonymous access and donor ownership. These are local tests with synthetic fixtures, **not a real provider cancellation test**. Manual UI checks: select Monthly, change amount/currency, review summary and explanation, verify the action stays disabled and no payment request is sent.
