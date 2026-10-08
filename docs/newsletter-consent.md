# Newsletter consent and cancellation
Both newsletter forms require an unchecked, dedicated email-news opt-in. Privacy/KVKK links are informational, never a blanket processing-consent checkbox. Server-side consent wording, version, source, locale and timestamp are recorded atomically with subscription state and a separate consent event.

Welcome messages include a purpose-bound HS256 cancellation token with subscriber ID and random cancellation key, signed with the server-only JWT secret. Tokens have no expiry so older emails remain usable. They cannot authorize any admin action. GET opens a confirmation screen; only POST cancels, preventing mail link scanners from cancelling subscriptions. Tokens are passed in a URL fragment, removed on arrival, and analytics are suppressed. Repeated cancellation succeeds without duplicate events. An email address alone never authorizes cancellation.

Legacy /unsubscribe?email= links resolve to a working recovery page. It sends a signed cancellation link to the registered address, without subscribing or recording marketing consent. SMTP rejection displays failure. The API does not return email membership on successful requests.

Historical subscribers without consent evidence remain in admin as Consent not recorded and are excluded from marketing CSV exports. Withdrawn subscriptions are also excluded. Staff can inspect current consent locale/version/time. Consent history resides in the private SubscriberConsentEvent table (service role only). Deleting a subscriber deletes its history under the existing admin deletion action.

Subscription success means confirmed database save, independent of optional welcome-email delivery. Tests mock email; SQL tests use rollback. No live marketing messages are sent during automated checks.
