# Public CMS data

The base page owns block order, numbers, images, links and donation amounts. Page translations supply wording only. Public readers merge translated wording into the latest base page instead of displaying an old translated snapshot.

Saving a base page synchronizes shared fields across its translations and invalidates public layouts. A deliberate shared-field change in a translated editor updates the base page and sibling translations; unchanged stale fields cannot overwrite current values. Database reads bypass the Next.js fetch cache.

- Edit achievement values in Pages → Home → Destekol achievements.
- Edit organization name, logo, email and footer copy in Appearance/settings.
- Edit address, registration number, verification link, country and contact notice in the contact page's Contact Form block.
- Empty factual fields stay empty; public components do not invent statistics, addresses, accreditation claims or authors.

Development uses a separate `.next-development-<port>` folder per port; production uses `.next-production` so a production build cannot overwrite development chunks.

Development now starts through `scripts/dev-next.cjs` and uses a directory per port, such as `.next-development-3002`. Review servers must use a separate port and output directory.

Page titles, descriptions, story labels, newsletter messages, project areas, categories and statuses are translated through each page's language editor. The `site.name` label is editable for all four languages under Translations. Base pages retain ownership of numbers, images, campaign IDs, links and block membership. Internal links resolve to the visitor's current language without changing the destination campaign or query.

Suggested donation amounts come from Home → Quick Donate; campaign defaults come from the campaign editor. The kindness box uses the amounts saved on its own rows. The comparison page is now under Pages → `why-destekol`, with four CMS language records.

Footer main content and the optional registration/copyright strip have separate CSS classes, so removing the strip cannot change the main footer layout.

Regression checks: `node --test scripts/cms-localization.test.cjs scripts/public-site-settings.test.cjs`.
