const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync('lib/analytics.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleUnderTest = { exports: {} };
new Function('module', 'exports', compiled)(moduleUnderTest, moduleUnderTest.exports);
const ga = moduleUnderTest.exports;
const accepted = { version: 2, updatedAt: '2026-10-13', analytics: true, marketing: false, functional: false };
const rejected = { ...accepted, analytics: false };
function browser(path = '/kit') {
    const location = new URL(`https://destekol.org${path}`);
    global.window = { location, document: { title: 'Destekol', referrer: '', documentElement: { lang: 'en' } } };
    return global.window;
}
function entries(command) { return (window.dataLayer || []).map(row => Array.from(row)).filter(row => row[0] === command); }
function events(name) { return entries('event').filter(row => row[1] === name); }

test('the standalone kit tracks independently, while the rest of the site requires analytics consent', () => {
    for (const consent of [null, rejected, accepted]) {
        browser(); ga.syncAnalyticsConsent(consent);
        assert.equal(ga.initializeAnalytics(), true);
        ga.trackPageView('/kit');
        assert.equal(events('page_view').length, 1);
        assert.equal(window[`ga-disable-${ga.GA_MEASUREMENT_ID}`], false);
    }
    for (const consent of [null, rejected]) {
        browser('/en'); ga.syncAnalyticsConsent(consent);
        assert.equal(ga.initializeAnalytics(), false);
        ga.trackPageView('/en');
        assert.equal(entries('config').length, 0);
        assert.equal(events('page_view').length, 0);
    }
});

test('one configuration and one manual view per route, including repeated React effects', () => {
    browser('/kit?utm_source=qr&utm_medium=print&utm_campaign=ngo_visits&token=secret');
    ga.trackPageView('/kit'); ga.trackPageView('/kit'); ga.initializeAnalytics();
    assert.equal(entries('config').length, 1);
    assert.equal(entries('config')[0][1], 'G-KREW1XWX0X');
    assert.equal(entries('config')[0][2].send_page_view, false);
    assert.equal(entries('config')[0][2].allow_google_signals, false);
    assert.equal(events('page_view').length, 1);
    assert.match(events('page_view')[0][2].page_location, /utm_campaign=ngo_visits/);
    assert.ok(!events('page_view')[0][2].page_location.includes('secret'));
    window.location = new URL('https://destekol.org/en/about');
    ga.syncAnalyticsConsent(accepted); ga.trackPageView('/en/about');
    assert.equal(events('page_view').length, 2);
    assert.equal(entries('config').length, 1);
});

test('leaving kit restores the website consent gate and cannot reuse the kit authorization', () => {
    browser(); ga.trackPageView('/kit');
    window.location = new URL('https://destekol.org/en');
    ga.syncAnalyticsConsent(rejected); ga.trackPageView('/en');
    assert.equal(window[`ga-disable-${ga.GA_MEASUREMENT_ID}`], true);
    assert.equal(events('page_view').length, 0); // Revocation purges queued events before the tag loads.
    window.location = new URL('https://destekol.org/kit');
    ga.syncAnalyticsConsent(null); ga.trackPageView('/kit');
    assert.equal(events('page_view').length, 1);
    assert.equal(entries('config').length, 1);
    assert.ok(entries('consent').some(row => row[1] === 'update' && row[2].analytics_storage === 'granted'));
});

test('private and authentication routes never initialize or send analytics', () => {
    for (const path of ['/admin/kit', '/api/admin/kit', '/en/account', '/en/contact/track?token=secret', '/en/donate/success', '/reset-password', '/en/unsubscribe', '/en/user%40example.com']) {
        browser(path); ga.syncAnalyticsConsent(accepted); ga.trackPageView(path);
        assert.equal(entries('event').length, 0, path);
        assert.equal(entries('config').length, 0, path);
    }
});

test('campaign URLs retain only safe UTMs and never include fragments, email, tokens or searches', () => {
    assert.equal(ga.analyticsLocation('https://destekol.org/kit?utm_source=qr&token=secret&q=name#private'), 'https://destekol.org/kit?utm_source=qr');
    assert.equal(ga.analyticsLocation('https://destekol.org/kit?utm_campaign=person%40example.com'), 'https://destekol.org/kit');
    assert.equal(ga.analyticsLocation('https://user:secret@destekol.org/kit'), null);
    assert.equal(ga.analyticsLink('https://drive.google.com/file/d/public/view?token=secret'), 'https://drive.google.com/file/d/public/view');
    assert.equal(ga.analyticsLink('mailto:person@example.com'), null);
});

test('every configured or custom link emits its stable ID and language; PDFs and videos add specific events', () => {
    browser(); ga.initializeAnalytics();
    for (const id of ['brochure', 'portfolio', 'sustainability', 'video', 'partnerships', 'contact', 'custom-123']) {
        ga.trackKitResourceClick({ id }, 'https://destekol.org/document.pdf?token=hidden', 'ar', 'عنوان');
    }
    assert.equal(events('kit_link_click').length, 7);
    assert.equal(events('file_download').length, 7);
    assert.equal(events('promotional_video_click').length, 1);
    assert.equal(events('kit_link_click').at(-1)[2].link_id, 'custom-123');
    assert.equal(events('kit_link_click')[0][2].site_language, 'AR');
    assert.ok(!JSON.stringify(entries('event')).includes('hidden'));
    const before = events('file_download').length;
    ga.trackKitResourceClick({ id: 'brochure' }, 'https://drive.google.com/drive/folders/public', 'tr', 'Broşür');
    assert.equal(events('file_download').length, before); // A folder click is not a PDF download.
});

test('language selection tracks only real changes; debug mode is explicitly opt-in', () => {
    browser('/kit?ga_debug=1'); ga.initializeAnalytics();
    ga.trackLanguageSelection('en', 'en', 'kit');
    ga.trackLanguageSelection('en', 'ar', 'kit');
    assert.equal(events('language_select').length, 1);
    assert.equal(events('language_select')[0][2].selected_language, 'AR');
    assert.equal(events('language_select')[0][2].debug_mode, true);
    browser(); ga.initializeAnalytics();
    assert.ok(!('debug_mode' in entries('config')[0][2]));
});

test('revoking consent stops events immediately and keeps the dataLayer object intact', () => {
    browser('/en'); ga.syncAnalyticsConsent(accepted); ga.trackPageView('/en');
    const dataLayer = window.dataLayer;
    ga.syncAnalyticsConsent(rejected); ga.trackFileDownload('/report.pdf');
    assert.equal(window.dataLayer, dataLayer);
    assert.equal(events('file_download').length, 0);
    assert.equal(entries('consent').at(-1)[2].analytics_storage, 'denied');
});

test('the kit has no cookie banner or consent dependency and keeps its language preference', () => {
    const kit = fs.readFileSync('components/kit/KitPage.tsx', 'utf8');
    assert.ok(!kit.includes('CookieBanner'));
    assert.ok(!kit.includes('readConsent'));
    assert.ok(kit.includes('LANGUAGE_COOKIE'));
});

test.after(() => { delete global.window; });
