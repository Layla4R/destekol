# Contact requests and notifications

Success is returned only after the message and pending notification are saved.
SMTP failure never requires resubmission: it leaves a durable FAILED/PENDING
notification. The sender receives a random reference and a private tracking link
in four languages. The token is stored only as SHA-256; the URL fragment is removed
from browser history on arrival. Tracking is POST-only, rate limited and returns
only status and dates, never complaint text, names or email. Analytics and pixels
are suppressed on tracking pages. Keep the private link to revisit the request.

Authorized complaints staff can set Received, In progress, Answered or Closed in
/admin/messages. Reading and processing sensitive requests requires specialist
permission. Read/unread state is independent of processing status. Updates and
manual notification retries are audited; a failed mutation is shown as an error.

The Netlify scheduled contact-notifications function runs every minute on published
deploys, processes up to three due notices per invocation, and waits at least five
minutes before retrying failures. A database lease prevents concurrent sending.
After five automatic attempts the message stays saved and staff can retry manually.
Old requests have UNKNOWN delivery status because prior SMTP outcomes were not
recorded. SMTP acceptance is recorded as SENT; this does not certify inbox delivery.

Scheduled functions require the database service role environment and SMTP settings
available to the Functions runtime. Confirm the Scheduled badge and execution logs
in Netlify Functions. Scheduled functions cannot be invoked via a public URL.
Reference: https://docs.netlify.com/build/functions/scheduled-functions/

Verification: node --test tests/contact-request.test.cjs tests/admin-access.test.cjs
Database tests exercise duplicate claims, already-sent protection and retry limits
in a transaction ending in rollback. Browser tests use disposable fixtures and a
mock receipt; no test emails are sent to real recipients.
