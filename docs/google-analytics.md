# Destekol Google Analytics 4

Measurement ID: **G-KREW1XWX0X**, confirmed by the user and the authenticated Google Web stream. The conflicting typed ID `G-KREW1XWXXJ` is not used. The user approved deployment of this revision on 13 October 2026 after the local build, tests and authenticated Google verification passed. Enhanced measurement settings were updated in the existing Google property to avoid parallel automatic events.

## Existing tracking audit

The existing `CookieBanner` could conditionally load GA or GTM. The saved `SiteSettings.gaMeasurementId` was empty, the public environment GA ID was the placeholder `G-XXXXXXXXXX`, and the public GTM ID was unset. That loader has been replaced with one root-level `next/script` integration. Meta and the existing website consent controls remain in place. No additional analytics dependency was installed.

## Standalone Kit behavior

The user clarified that tracking must start without waiting for the cookie dialog. GA loads on every eligible public route immediately using advanced Consent Mode. `/kit` remains visually independent, without the main site's header, footer or cookie banner, and does not read or change the main site's saved preferences. On `/kit`, analytics storage always remains denied, including after navigating from a consented main-site page. Page views, resource clicks, language changes, document clicks and promotional video clicks are sent as cookieless signals. Advertising storage, advertising personalization and Google signals stay disabled.

On the main site, existing analytics acceptance grants analytics storage; an absent or rejected choice leaves storage denied. Refusing cookies does not block cookieless page views and interactions. Existing cookie preference storage, Meta/external-content permissions, visible controls and public policy text are unchanged. Google's reporting of denied-consent signals depends on processing and modeling eligibility; sending a signal does not guarantee exact user counts or that it will appear in reports. Admin, API, authentication, account, private contact tracking, unsubscribe and payment return pages are excluded. The single tag and runtime are reused across App Router navigation; configuration uses `send_page_view: false` and manual route views are deduplicated.

Kit language switches remain on `/kit` and keep the existing `NEXT_LOCALE` preference behavior. No analytics consent choice is written or changed by the Kit page.

`Views` counts page views. `Total users` and `Active users` distinguish browsers using Google's identifiers; they are not a verified count of individual human beings. Clearing cookies, different devices, blockers and consent elsewhere affect user counts. Google does not reveal the visitor's real identity.

## Events and parameters

| Event | Trigger | Useful parameters |
| --- | --- | --- |
| `page_view` | Initial public page load and client route changes, including `/kit` | `page_location`, `page_title`, `site_language` |
| `kit_link_click` | Click or middle-click on any active Kit card, including added cards | `link_id`, `link_text`, `link_url`, `site_language` |
| `site_link_click` | Public main-site navigation or outbound link click | sanitized `link_url`, `link_type`, `site_language` |
| `language_select` | A different AR, EN or TR selection | `selected_language`, `previous_language`, `selection_location` |
| `file_download` | Click on a supported document URL, including `.pdf` | `file_name`, `file_extension`, `link_url`, `link_id` for Kit |
| `promotional_video_click` | Click on the configured promotional video card | `link_id`, `link_text`, `link_url`, `site_language` |

There are currently six default resource cards because “Marketing Kit for Visits” is the page heading. Tracking covers all configured and custom cards and never restores a removed card. Disabled cards generate no click events. A Drive folder or `/view` destination is a resource click, not a confirmed PDF download. Downloads occurring inside Google Drive and video playback on third-party sites are outside this website's visibility; the integration records the outbound click.

URLs sent to GA exclude arbitrary queries, fragments, email-style values and private routes. Only safe `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` and `utm_id` values are retained on the visited page. Form values, user accounts, donation references, consent records and authentication tokens are not included in manual events.

## Google property configuration

In **Admin → Data collection and modification → Data streams → the Destekol Web stream → Enhanced measurement settings**:

1. Under Page views advanced settings, **Page changes based on browser history events** is off. Initial/manual views are controlled by this integration. Google's default automatic history tracking can duplicate SPA views.
2. Automatic **File downloads** is off, because this integration sends `file_download` itself.
3. Automatic **Outbound clicks**, **Form interactions** and **Site search** are off so the intended manual event set controls what is collected, without parallel click events, automatic form telemetry or search terms.

These settings were saved and re-opened to confirm persistence on 13 October 2026 in account **Destekol**, property **Destekol Website.** (property ID `558620410`), Web stream **Destekol** (`16118545843`). Page loads, Scrolls and Video engagement remain enabled. Public policy text, consent settings and property access were not changed. Register event-scoped custom dimensions in **Admin → Data display → Custom definitions** for `link_id`, `site_language`, `selected_language` and `selection_location` if you want to group long-term reports by those fields. GA processes custom dimensions prospectively; these definitions have not been created by this update.

## QR attribution

Use this optional campaign URL in a new QR code:

`https://destekol.org/kit?utm_source=qr&utm_medium=print&utm_campaign=ngo_visits`

The page still opens at the same `/kit` route, in all three languages. Customize the campaign name for each printed batch. Existing QR assets still encode the original plain URL; those untagged scans cannot retrospectively be distinguished from other direct visits. The site does not invent campaign attribution or redirect the QR destination.

## Verify Realtime, DebugView and users

1. Open GA's Destekol property and **Reports → Realtime**. For an observable reporting test, open a main-site page, accept analytics using the existing dialog and reload it. Check `page_view`, then navigate to a public content page and follow links to check `site_link_click`. This uses analytics storage legitimately granted by that test browser.
2. For DebugView, open a main-site URL with `?ga_debug=1`, accept analytics and reload, then open **Admin → Data display → DebugView**. Inspect the event parameters. Google does not show events in DebugView when analytics storage consent is denied, so Kit's cookieless events cannot be verified there. Verify their emission and consent flags with Tag Assistant or browser network inspection; Google reporting additionally depends on processing/modeling eligibility. The `ga_debug` flag is excluded from transmitted page URLs. Development console logs with `[Destekol GA4]` show the sanitized payloads.
3. Use **Reports → Engagement → Pages and screens** filtered to `/kit` for views. For Kit-specific users, use an Exploration filtered by page path `/kit`, with Views, Total users and Active users. Group `kit_link_click` events by `link_id` and `site_language` after registering the custom dimensions.
4. Confirm that rejecting analytics on public content pages continues sending signals with analytics storage denied. On Kit there should be one Google tag and no cookie-preference dialog. Browser blockers or GA internal/developer traffic filters may suppress test data; check those if Realtime or DebugView remains empty.

This revision passed the production build, TypeScript checking and 35 focused tests on 13 October 2026: multilingual public routes before consent, acceptance and revocation, private-route exclusion, Kit storage isolation, sanitized website links, downloads and videos, and the first-render race with a previously accepted preference. No public privacy or cookie policy files were modified for this update.

Authenticated property-side verification on 13 October 2026 confirmed **Data flowing** for the exact Measurement ID. Realtime showed the deployed Kit's `page_view`, `language_select` and `user_engagement`. Tag Assistant found one on-page Google tag and a Page View hit for this destination. These live Kit observations describe the previously deployed version; they do not establish reporting of the new denied-storage Kit behavior.

For the revised local code, browser verification found exactly one Google tag on `/en/about` before any cookie choice. After rejecting non-essential cookies, navigating to `/en/projects` emitted `site_link_click` and one route `page_view` in development logs. A separate test at `http://127.0.0.1:3004/en/about?ga_debug=1` granted **Analytics only** using the existing dialog, reloaded, and navigated to Projects. Realtime then showed `site_link_click`; DebugView showed two page views and one `site_link_click`. Inspecting its parameters confirmed the local `/en/about` page location and `site_language=EN`, proving receipt of the revised local implementation rather than merely the production tag. Test events are ordinary website visits and were not submitted through a fabricated Measurement Protocol request.

Kit's new denied-storage signals are covered by emission/consent tests, not claimed as visible in DebugView or as exact unique-user counts. Google explicitly excludes events without Analytics cookie consent from DebugView. Reporting of these signals still depends on processing and modeling eligibility. Existing QR attribution, dynamic resource IDs, supported document/video clicks and language changes are covered by the focused tests.

Official references: [Next.js Script](https://nextjs.org/docs/app/api-reference/components/script), [manual GA4 page views](https://developers.google.com/analytics/devguides/collection/ga4/views), [Google consent mode](https://developers.google.com/tag-platform/security/guides/consent), [DebugView](https://support.google.com/analytics/answer/7201382), [campaign attribution](https://support.google.com/analytics/answer/10917952).
