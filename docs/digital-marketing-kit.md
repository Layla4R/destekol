# Destekol digital marketing kit

Permanent public URL: **https://destekol.org/kit**. Language changes stay at `/kit` without query strings or locale routes. Production publication was authorized on 13 October 2026.

The page now fills the viewport instead of sitting inside a small framed card. The banner spans the screen; the stacked links use a fluid content area up to 1152px on desktop and the available width on phones.

## Manage links from the admin panel

Open **`/admin/kit`**, or choose **Kit Links** under Content in the existing admin sidebar. Sign in with an administrator or a staff account that has `pages.view`; editing requires `pages.edit`. Read-only staff can inspect settings and previews, but form controls and server-side writes are disabled.

1. Paste the destination in **الرابط العام لجميع اللغات** to use one link for every language.
2. Expand **عناوين وروابط اللغات** to override a button title or destination for English, Turkish or Arabic. A language-specific destination takes precedence. Clearing that language field falls back to the shared URL. The existing Contact card starts with three locale-specific destinations; clear or update those if you want to replace them with a shared destination.
3. Use **تفعيل الرابط** to enable or temporarily disable a card. Empty and disabled destinations display “Coming soon”.
4. Use **إضافة رابط جديد** for an additional card, with translated titles, icon and color. Additional cards appear after the remaining main cards. Every card has a delete button, including the defaults; deleting all cards is supported. Save to persist deletions. Maximum: 40 cards total.
5. Check the language preview, then select **حفظ الروابط**. Only a successful database response reports a completed save. Unsaved edits remain available if validation or saving fails.

Settings are stored in the existing tenant-scoped `Page.sections` JSON, in a hidden system record with ID `destekol-kit-links` and slug `kit`. The record is created on the first admin save, is not published as a generic CMS page, and does not appear in the normal Pages list or site navigation. `/kit` reads its resource data on each request through a server-only Supabase client; no credentials are sent to the browser. No schema migration or new table is needed. The standard page editor cannot overwrite the kit settings or claim the reserved `/kit` slug.

There is no need to edit code or redeploy to change saved URLs once this implementation is deployed. Reload the public page after saving. If there is no saved configuration, the defaults in `lib/kit-config.ts` are used. A database outage displays no cards rather than resurrecting deleted defaults; the admin editor reports the load/save error. Legacy `visits` cards are removed on read and save while preserving the other configured URLs: Marketing Kit for Visits is now a visible page heading.

## Files

- `app/kit/page.tsx`: server-rendered page and localized SEO, Open Graph, Twitter and canonical metadata.
- `components/kit/KitPage.tsx`: full-page branding, accessible language buttons, configured resource cards, Arabic RTL layout.
- `components/kit/kit.module.css`: fluid mobile-first styling; existing site fonts; reduced-motion support.
- `lib/kit-config.ts`: ordered resources, URLs, supported languages and safe URL resolution.
- `lib/kit-copy.ts`: English, Turkish and Arabic content.
- `lib/kit-settings.ts`: server-only CMS reads and writes, with safe public fallback.
- `app/admin/(panel)/kit/page.tsx`: protected admin editor page.
- `components/admin/KitLinksEditor.tsx`: URL/title editing, additional cards, toggles, translations, preview, validation and save status.
- `app/api/admin/kit/route.ts`: authenticated reads and validated writes; refreshes `/kit` after saving.
- `lib/admin-policy.ts`: permissions for the editor and its API.
- `components/admin/AdminSidebar.tsx` and `AdminTopbar.tsx`: editor navigation and page title.
- `app/api/admin/pages/route.ts`, `app/api/admin/pages/[id]/route.ts`, `app/admin/(panel)/pages/[id]/page.tsx`: hide/protect the settings record and redirect it to its dedicated editor.
- `tests/kit-links.test.cjs`: URL validation, locale precedence, storage, error handling and authorization tests.
- `public/kit/destekol-logo.png`: unchanged copy of the supplied official logo. The original white margins are cropped only by the display container, not by altering the image file.
- `public/kit/destekol-kit-qr.png` and `.svg`: printable QR assets for the permanent URL.
- `scripts/generate-kit-qr.py`: reproducible QR generation using development-only ReportLab and Pillow; no new application dependencies.
- `middleware.ts`: `/kit` bypasses the existing locale rewrite and supplies the preferred document language.
- `components/site/LanguageSwitcher.tsx`: saves the selected website language in `NEXT_LOCALE` while preserving existing navigation behavior.
- `app/sitemap.ts`: one `/kit` entry with the same URL for all three languages.

## Developer fallback configuration

Normal link updates use the admin editor above. Developers can edit **`lib/kit-config.ts`** only to change the initial fallback defaults, keeping `KIT_RESOURCES` in its existing order. Saved CMS settings take precedence. Set `url` for a shared document or video, or `localizedUrls` for translated versions:

```ts
{
    id: "brochure",
    tone: "blue",
    url: null,
    localizedUrls: {
        en: "/kit/documents/brochure-en.pdf",
        tr: "/kit/documents/brochure-tr.pdf",
        ar: "/kit/documents/brochure-ar.pdf",
    },
}
```

These are example paths, not supplied documents. Upload the actual approved PDFs under `public/kit/documents/` before enabling their URLs, or use official HTTPS destinations. Set a shared `url` to use the same resource in every language. An omitted localized URL falls back to the shared URL; an explicit `null` keeps that language disabled. Unsafe schemes and malformed URLs remain disabled. External HTTPS links open in a new tab with accessible notice; relative links open in the same tab.

The contact route exists in this project and is configured for all three languages. The visit kit, brochure, portfolio, sustainability report, promotional video and partnership page are disabled until their official URLs are verified. Generic project listings, policy pages and the available `welcome.mp4` are not assumed to be the requested official materials.

The official homepage navigation and public contact page were inspected on 13 October 2026. The contact page was verified at `https://destekol.org/tr/contact`. No official destinations for the six requested marketing/partnership resources were found in the inspected public navigation or project assets; this does not claim that no unpublished or unlisted resources exist.

## Languages

The existing `NEXT_LOCALE` cookie remembers the language preference. Without a supported preference Kit starts in English. Arabic sets `lang="ar"` and `dir="rtl"` on both the page and document. No router navigation is needed to switch the kit language. Language preference is separate from analytics consent and keeps its existing behavior.

## Banner, slogan and analytics

The official slogans are Making a Lasting Impact, Hayata Kalıcı Bir Etki and أثرٌ للحياة. Each appears once in the banner; the repeated slogan below the logo has been removed for desktop and mobile. The dedicated `public/kit/banner-center.webp` keeps the girl in the central area without a white overlay. Text occupies a separate side panel on desktop and sits below the photo on phones. The original homepage image and official logo are unchanged. Contact always opens in a new tab with `noopener noreferrer`.

The independent Kit uses Google Analytics directly without the website's cookie dialog. This does use Google's analytics cookies for browser-level user counts. See [Google Analytics integration and verification](google-analytics.md) for events, QR UTMs, Realtime, DebugView and required property settings.

## QR downloads and printing

- PNG: `/kit/destekol-kit-qr.png`
- SVG: `/kit/destekol-kit-qr.svg`

Both encode exactly `https://destekol.org/kit`, with navy modules on an opaque white background, four-module quiet zone and high (H) error correction. The PNG has 300 DPI metadata. Use SVG for scalable print artwork. Keep the white margin, avoid overlaying artwork and test the final printed sample with a phone before distributing it. The QR destination becomes available after the page is deployed at the official domain.

Regenerate using Python with `reportlab` and `Pillow` installed:

```sh
python scripts/generate-kit-qr.py
```

## Validation

Completed verification of the new full-page layout: all three languages at 320px, 390px, 768px and 1440px, with no horizontal overflow and the same `/kit` URL. Browser tests against the actual application and an isolated in-memory Supabase-compatible test backend verified adding, saving, reloading, translated titles/destinations, deleting custom links, disabling a link, visible validation errors and read-only staff controls. Actual route checks returned 200 for viewer reads, 403 for viewer writes and 401 for anonymous reads. These test saves did not change the real database. The original QR assets are unchanged and both previously decoded to exactly `https://destekol.org/kit`; logo hashes also matched the supplied original.

The current 31 focused tests in `tests/analytics.test.cjs`, `tests/kit-links.test.cjs`, `tests/admin-access.test.cjs` and `scripts/cms-public-controls.test.cjs` passed, as did TypeScript checking and the production build on 13 October 2026. A broader earlier check of `scripts/cms-localization.test.cjs` exposed an existing assertion mismatch for reporting evidence fields; both that test and its implementation (`lib/cms-localization.ts`) are unchanged from Git HEAD. This unrelated failure was left untouched.

Run `node node_modules/typescript/bin/tsc --noEmit` and `npm run build`. For browser verification, start `npm run dev`, open `http://localhost:3002/kit`, check all languages and saved preferences, verify the unchanged URL, inspect at 320px, 390px, 768px and desktop widths, and confirm disabled items have no destination. Scan the QR images to verify their decoded destination. Check a normal locale route and the sitemap to confirm existing navigation still behaves as before.

Suggested commit message: **`feat: add full-page marketing kit with admin link management`**
