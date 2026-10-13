# Destekol Google Analytics 4

Measurement ID: **G-KREW1XWX0X**. Production publication was authorized on 13 October 2026. No Google property settings have been changed.

## Existing tracking audit

The existing `CookieBanner` could conditionally load GA or GTM. The saved `SiteSettings.gaMeasurementId` was empty, the public environment GA ID was the placeholder `G-XXXXXXXXXX`, and the public GTM ID was unset. That loader has been replaced with one root-level `next/script` integration. Meta and the existing website consent controls remain in place. No additional analytics dependency was installed.

## Standalone Kit behavior

The user clarified that `/kit` is an independent marketing interface and must measure visits and users directly without using the site's cookie-preference dialog. GA therefore loads on `/kit` immediately, even if the site's saved analytics preference is absent or rejected. The page does not read or change the site's saved preferences. **This is ordinary GA measurement using Google's `_ga` cookies; it is not cookieless analytics.** Advertising storage, advertising personalization and Google signals stay disabled.

Elsewhere on the public website, GA loads only after the existing analytics permission is granted. Leaving Kit restores that gate. Admin, API, authentication, account, private contact tracking, unsubscribe and payment return pages are excluded. The single tag and runtime are reused across App Router navigation; configuration uses `send_page_view: false` and manual route views are deduplicated.

Kit language switches remain on `/kit` and keep the existing `NEXT_LOCALE` preference behavior. No analytics consent choice is written or changed by the Kit page.

`Views` counts page views. `Total users` and `Active users` distinguish browsers using Google's identifiers; they are not a verified count of individual human beings. Clearing cookies, different devices, blockers and consent elsewhere affect user counts. Google does not reveal the visitor's real identity.

## Events and parameters

| Event | Trigger | Useful parameters |
| --- | --- | --- |
| `page_view` | Initial public page load and client route changes, including `/kit` | `page_location`, `page_title`, `site_language` |
| `kit_link_click` | Click or middle-click on any active Kit card, including added cards | `link_id`, `link_text`, `link_url`, `site_language` |
| `language_select` | A different AR, EN or TR selection | `selected_language`, `previous_language`, `selection_location` |
| `file_download` | Click on a supported document URL, including `.pdf` | `file_name`, `file_extension`, `link_url`, `link_id` for Kit |
| `promotional_video_click` | Click on the configured promotional video card | `link_id`, `link_text`, `link_url`, `site_language` |

There are currently six default resource cards because “Marketing Kit for Visits” is the page heading. Tracking covers all configured and custom cards and never restores a removed card. Disabled cards generate no click events. A Drive folder or `/view` destination is a resource click, not a confirmed PDF download. Downloads occurring inside Google Drive and video playback on third-party sites are outside this website's visibility; the integration records the outbound click.

URLs sent to GA exclude arbitrary queries, fragments, email-style values and private routes. Only safe `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` and `utm_id` values are retained on the visited page. Form values, user accounts, donation references, consent records and authentication tokens are not included in manual events.

## Google property setup before deployment

In **Admin → Data collection and modification → Data streams → the Destekol Web stream → Enhanced measurement settings**:

1. Under Page views advanced settings, turn off **Page changes based on browser history events**. Initial/manual views are controlled by this integration. Google's default automatic history tracking can duplicate SPA views.
2. Turn off automatic **File downloads**, because this integration sends `file_download` itself.
3. Turn off automatic **Outbound clicks** and **Form interactions** so the intended manual event set controls what is collected, without parallel click events or automatic form telemetry.

These settings have not been changed on your Google account. Register event-scoped custom dimensions in **Admin → Data display → Custom definitions** for `link_id`, `site_language`, `selected_language` and `selection_location` if you want to group long-term reports by those fields. GA processes custom dimensions prospectively.

## QR attribution

Use this optional campaign URL in a new QR code:

`https://destekol.org/kit?utm_source=qr&utm_medium=print&utm_campaign=ngo_visits`

The page still opens at the same `/kit` route, in all three languages. Customize the campaign name for each printed batch. Existing QR assets still encode the original plain URL; those untagged scans cannot retrospectively be distinguished from other direct visits. The site does not invent campaign attribution or redirect the QR destination.

## Verify Realtime, DebugView and users

1. Open GA's Destekol property and **Reports → Realtime**. Visit `/kit` in another browser or tab. Check the page title/location and the `page_view` count, then click active cards and change languages. Expect `kit_link_click`, `language_select` and `promotional_video_click`. A real `.pdf` URL also sends `file_download`.
2. For DebugView, open `/kit?ga_debug=1` (you may append QR UTMs). Open **Admin → Data display → DebugView**, select the test device, and inspect each event's parameters. The `ga_debug` flag is excluded from the transmitted page URL. Remove it after testing. Development console logs with `[Destekol GA4]` show the same sanitized payloads.
3. Use **Reports → Engagement → Pages and screens** filtered to `/kit` for views. For Kit-specific users, use an Exploration filtered by page path `/kit`, with Views, Total users and Active users. Group `kit_link_click` events by `link_id` and `site_language` after registering the custom dimensions.
4. Confirm that rejecting analytics on a normal website page prevents its events, while `/kit` still measures directly. On Kit there should be one Google tag and no cookie-preference dialog. Browser blockers or GA internal/developer traffic filters may suppress test data; check those if Realtime or DebugView remains empty.

Local checks cover direct Kit tracking with absent/rejected site consent, consent isolation when leaving Kit, route views and deduplication, sensitive-route exclusions, sanitized UTM attribution, dynamic links, document/video events, language changes and revocation. The production build, TypeScript and 31 relevant tests passed on 13 October 2026. Browser checks confirmed exactly one Google tag with the supplied ID, no Kit consent dialog, a single initial `page_view`, retained QR UTMs, language selection, and both `kit_link_click` and `promotional_video_click` for the active video. Arabic banner rendering also passed desktop and phone inspection without horizontal overflow. Property-side event receipt and reporting must be confirmed in your authenticated Google account; it has not been claimed as verified here.

Official references: [Next.js Script](https://nextjs.org/docs/app/api-reference/components/script), [manual GA4 page views](https://developers.google.com/analytics/devguides/collection/ga4/views), [Google consent mode](https://developers.google.com/tag-platform/security/guides/consent), [DebugView](https://support.google.com/analytics/answer/7201382), [campaign attribution](https://support.google.com/analytics/answer/10917952).
