# Public CMS data

The base page owns block order, numbers, images, links and donation amounts. Page translations supply wording only. Public readers merge translated wording into the latest base page instead of displaying an old translated snapshot.

Saving a base page synchronizes shared fields across its translations and invalidates public layouts. A deliberate shared-field change in a translated editor updates the base page and sibling translations; unchanged stale fields cannot overwrite current values. Database reads bypass the Next.js fetch cache.

- Edit achievement values in Pages → Home → Destekol achievements.
- Edit organization name, logo, email and footer copy in Appearance/settings.
- Edit address, registration number, verification link, country and contact notice in the contact page's Contact Form block.
- Empty factual fields stay empty; public components do not invent statistics, addresses, accreditation claims or authors.

Development uses `.next-development`; production uses `.next-production` so a production build cannot overwrite development chunks.

Regression checks: `node --test scripts/cms-localization.test.cjs scripts/public-site-settings.test.cjs`.
