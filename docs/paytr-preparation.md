# PayTR preparation

The donation forms now list only these planned PayTR methods in Turkish, Arabic,
English and French: Visa / Mastercard / TROY cards, Havale / EFT / FAST bank
transfers, and recurring monthly donations. All buttons remain disabled. This
change prepares the interface and signing protocol; it does not activate checkout.

Server-only credentials are PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY and
PAYTR_MERCHANT_SALT. Never use NEXT_PUBLIC variables for keys or salts. Test mode
must remain enabled during integration. Existing USD campaign amounts must not be
relabelled TRY without an explicit currency conversion and campaign update.

`lib/paytr-protocol.ts` prepares signed card and bank token requests and validates
callback signatures. Card amounts use minor units; bank amounts use decimal TRY.
Card token requests additionally need donor name, address, phone, approved return
URLs and language. Do not substitute fabricated donor details. For a cart, call
`createCartDonation` to persist one pending donation for the total and separate
`DonationAllocation` rows for every campaign before requesting one token. The
allocation trigger credits every campaign atomically on payment confirmation and
distributes transaction-wide refunds proportionally with exact cent rounding.
Duplicate callbacks do not credit campaigns twice. The payment adapter must pass
the entire validated cart, never only its first campaign. Mixed one-time/monthly
carts remain rejected until separate recurring schedules are implemented; grouped
monthly renewals must copy their allocations before confirmation. Only a verified callback may
complete payment through the atomic payment ledger; redirects cannot confirm it.

Before activation, finish the server checkout and callback routes, connect the
forms, and test successful, failed, duplicate and tampered callbacks. Callback
retries must be acknowledged only after durable persistence. Credentials alone
must not enable any button.

Bank transfer API permissions must be enabled by PayTR. Confirm FAST support for
this merchant before enabling the full bank-transfer label. Recurring monthly
donations need Direct API/card-storage and Non3D permissions, explicit donor
authorization, encrypted provider tokens, a retry-safe scheduled charge process,
and working subscription cancellation. Never represent a one-time card charge as
an active monthly subscription. Store no PAN or CVV on this site. Card network
acceptance depends on the merchant account and PayTR configuration.

Official documentation:
- https://dev.paytr.com/iframe-api/iframe-api-1-adim
- https://dev.paytr.com/iframe-api/iframe-api-2-adim
- https://dev.paytr.com/havale-eft-iframe-api/havale-eft-iframe-api-1-adim
- https://dev.paytr.com/direkt-api/kart-saklama-api/kayitli-kart-tekrarlayan-odeme
