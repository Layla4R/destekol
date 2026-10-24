# Destekol — Google for Nonprofits A2 route and interaction audit

Date: 24 October 2026. Public, read-only inspection of `https://destekol.org/` in AR, EN, FR and TR.

## Coverage and results

- Before deployment, the browser rendered all 113 advertised sitemap URLs. The corrected live sitemap now advertises 109 URLs; it excludes the four draft transparency routes.
- Post-deployment HTTP GET crawl: 191 internal URL variants, including 52 browser-observed query URLs and the root URL. All 191 returned 200. No HTTP redirects were observed. See `google_nonprofits_routes_2026-10-24.csv` for each URL, status, final URL and counts, and the JSON for source links, buttons and forms.
- Six distinct external HTTP links were checked with GET: the published DERBİS verification link, four Google Drive links and the WhatsApp link. All returned 200; WhatsApp resolved to `api.whatsapp.com`. See `google_nonprofits_external_2026-10-24.json`. This checks link availability, not the contents of private or third-party documents.
- The post-deployment crawl recorded 970 button instances and 83 form instances across the tested URLs. These include repeated header, footer, language, donation and newsletter controls. No form was submitted and no donation or account action was taken.
- Browser interaction checks: the home hero next/dot controls changed the visible slide; the language menu changed `/ar` to `/en`; the Arabic news category filter changed the URL and reduced the visible list to the matching project news item; the assistant opened and closed without sending a message. After deployment, the home projects carousel showed four CMS project cards and its Next button advanced to the second group of four visible cards. The previously uncertain `/tr/news/water-campaign-launch` rendered its article in the browser and returned HTTP 200.

## Repaired sitemap defect

`/ar/transparency`, `/en/transparency`, `/fr/transparency` and `/tr/transparency` belonged to a Draft CMS page but were listed in the old sitemap, yielding four 404 results. Commit `c532bf8` removed the unconditional sitemap entry; the published CMS query will include the page if it is published later. The post-deployment sitemap and complete GET crawl confirm these four draft URLs are no longer advertised or linked in the tested public pages, and there are no broken public links in the audited set. A2 is complete for the public route and interaction inventory described here.

## Verification boundary

This is a public navigation and response inventory. Newsletter/contact/account submissions, donation checkout and payment flows were excluded because they create data or financial side effects. The browser did not read server logs or restricted authenticated destinations. These flows belong to their separate functional-review tasks.
