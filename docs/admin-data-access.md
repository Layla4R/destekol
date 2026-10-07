# Data and complaint access

Access is enforced on the server using current database roles and explicit
permissions, not JWT role claims or the visibility of buttons. An empty staff
permission list grants no access. VIEWER can only use explicitly granted `.view`
permissions and cannot export, edit, delete or manage staff.

Messages default to sensitive, including existing records. Reading sensitive
messages requires both `messages.view` and `messages.sensitive.view`. Read-status
changes also need `messages.edit`, and deletion needs `messages.delete`. Bulk read
updates and unread counts exclude sensitive rows for general-message staff. Shared
mail notifications contain no complaint body or sender details.

Donor listing/profile, subscriber listing, donation listing, receipts, reports
and CSV exports are protected separately. Donor CSV export is restricted to donor
accounts. Only the non-staff ADMIN owner can change staff access or issue/revoke
invitations; invitations cannot overwrite an administrator. Access revocation is
effective on the next request, including existing signed sessions.

`AdminAuditLog` records actor ID, action, outcome, record ID, site and time. It is
private and append-only for the application service role. Audit-write failure
blocks access before private reads or mutations. Completed mutations and exports
also record results. No tokens, search queries, complaint text or exported data
are stored in the audit log. View the latest 200 events at `/admin/audit` with
`audit.view`. Activation logs no longer print activation tokens or database error
payloads. Previously collected deployment logs require separate retention handling.

## Verification

Run from the repository:

```
node --test tests/admin-access.test.cjs tests/payment-policy.test.cjs scripts/public-site-settings.test.cjs
```

Run `tests/staff-access.sql` in the project's SQL editor. It ends in ROLLBACK and
leaves no test staff or invitations behind.

For manual testing, use disposable staff accounts in a test environment:

1. As owner, assign VIEWER only the content-view permissions. Direct requests to
   `/api/admin/subscribers/export`, `/api/admin/users/export?role=DONOR` and
   `/api/admin/donations/export` must return 403. Anonymous requests return 401.
2. Assign EDITOR `messages.view` alone: sensitive complaints and their unread
   counts must be absent. Add `messages.sensitive.view`: complaints become visible.
3. Without `messages.edit`/`messages.delete`, direct mutation requests return 403.
   The Complaints Officer preset grants viewing and read-status editing, not deletion.
4. Give EDITOR `subscribers.export`: export succeeds and the audit log records
   ALLOW and SUCCESS. Revoke it without signing out: the next export returns 403.
5. Staff cannot grant themselves permissions or replace an owner's account using
   an invitation. Empty permissions must never become full access.
6. Activate a disposable donor account: its activation token must not appear in
   application console output.

## Project-wide roles and evaluation accounts

The owner can manage roles at /admin/staff. EDITOR (Content Editor), VIEWER,
FINANCE (Finance Manager) and COMPLAINTS (Complaints Officer) are explicit roles.
Each role also requires its assigned permissions; a name alone grants no access.
Content presets, financial exports/reports, specialist complaints, settings, media
uploads and translations are independently guarded. Navigation shows permitted
sections; direct API and server-page requests enforce the same restrictions.

Four evaluation users were created in the Destekol schema on 7 October 2026.
Credentials are saved only in ignored private/evaluation-accounts.md and JSON,
never in Git. They expire after seven days, including existing sessions. The owner
can revoke access immediately by choosing Revoke Staff Access.

Use separate private browser sessions for each account at /admin/login:

| Account | Permitted | Denied |
|---|---|---|
| Viewer | Read public content | Editing, exports, private donor data, complaints |
| Content Editor | Pages, posts, campaign editing, uploads, translations | Private donor data, complaints, settings, staff management |
| Finance Manager | Donations, receipts, reports, donor/subscriber view and exports | Complaints, content editing, settings, staff management |
| Complaints Officer | Sensitive complaint view and read-status changes | Complaint deletion, finance, donor exports, staff management |

Run node scripts/test-evaluation-accounts.cjs with the development server on 3002
to verify actual authenticated requests. Test results contain statuses only,
not exported private data. The account creation script is one-time provisioning;
rerunning it creates a new batch. No invitation emails are sent for evaluation users.
