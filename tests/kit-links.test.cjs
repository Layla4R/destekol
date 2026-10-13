const fs = require('node:fs');
const assert = require('node:assert/strict');
const test = require('node:test');
const ts = require('typescript');
function load(file, mocks = {}) {
    const module = { exports: {} };
    const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    new Function('require', 'module', 'exports', compiled)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
    return module.exports;
}
const config = load('lib/kit-config.ts');
const defaults = () => structuredClone(config.KIT_RESOURCES);

test('language-specific URLs override shared links and cleared/disabled links stay disabled', () => {
    const resource = { ...defaults()[0], url: 'https://destekol.org/common.pdf', localizedUrls: { ar: '/kit/ar.pdf', tr: null } };
    assert.equal(config.getKitResourceUrl(resource, 'en'), 'https://destekol.org/common.pdf');
    assert.equal(config.getKitResourceUrl(resource, 'ar'), '/kit/ar.pdf');
    assert.equal(config.getKitResourceUrl(resource, 'tr'), null);
    assert.equal(config.getKitResourceUrl({ ...resource, enabled: false }, 'ar'), null);
});

test('unsafe links, invalid types, duplicate IDs and reordered core items are rejected before saving', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,evil', '//evil.invalid/file', '/\\evil.invalid', 'http://example.invalid', 'https://user:password@example.invalid']) {
        const rows = defaults(); rows[0].url = url;
        assert.throws(() => config.parseKitResources(rows), /HTTPS/);
    }
    const rows = defaults(); rows[0].url = { url: 'https://destekol.org' };
    assert.throws(() => config.parseKitResources(rows));
    assert.throws(() => config.parseKitResources(defaults().reverse()));
    assert.equal(config.parseKitResources(defaults().slice(1)).length, defaults().length - 1);
    assert.deepEqual(config.parseKitResources([]), []);
    assert.throws(() => config.parseKitResources([...defaults(), { id: 'custom-1', tone: 'blue', url: null, titles: { en: 'First' } }, { id: 'custom-1', tone: 'blue', url: null, titles: { en: 'Second' } }]));
});

test('additional links support titles, safe URLs and a fixed position after the remaining main items', () => {
    const custom = { id: 'custom-1', tone: 'green', icon: 'link', url: ' https://destekol.org/en/about ', titles: { en: 'About us', ar: 'من نحن' } };
    const rows = config.parseKitResources([...defaults(), custom]);
    assert.equal(rows.at(-1).url, 'https://destekol.org/en/about');
    assert.equal(rows.at(-1).titles.ar, 'من نحن');
    assert.deepEqual(rows.slice(0, -1).map(row => row.id), defaults().map(row => row.id));
    assert.throws(() => config.parseKitResources([...defaults(), { ...custom, titles: {} }]));
});

function storageFixture() {
    let row = null, failed = false;
    const writes = [], filters = [];
    const query = {
        select() { return this; }, eq(key, value) { filters.push([key, value]); return this; },
        async maybeSingle() { return { data: row, error: failed ? { code: 'offline' } : null }; },
        upsert(value, options) { writes.push({ value, options }); if (!failed) row = value; return this; },
        async single() { return { data: row, error: failed ? { code: 'offline' } : null }; },
    };
    const settings = load('lib/kit-settings.ts', {
        'server-only': {}, '@/lib/kit-config': config,
        '@/lib/supabase': { getSupabase: () => ({ from: table => { assert.equal(table, 'Page'); return query; } }) },
    });
    return { settings, writes, filters, seed: value => { row = value; }, fail: () => { failed = true; } };
}

test('CMS storage persists all language URLs, edits and removals without creating a schema', async () => {
    const fixture = storageFixture();
    assert.equal((await fixture.settings.readKitSettings()).resources.length, defaults().length);
    const resources = config.parseKitResources(defaults());
    resources[0].url = 'https://destekol.org/visits.pdf';
    resources[0].localizedUrls.ar = '/kit/visits-ar.pdf';
    await fixture.settings.saveKitSettings(resources);
    const loaded = await fixture.settings.readKitSettings();
    assert.equal(config.getKitResourceUrl(loaded.resources[0], 'en'), 'https://destekol.org/visits.pdf');
    assert.equal(config.getKitResourceUrl(loaded.resources[0], 'ar'), '/kit/visits-ar.pdf');
    assert.equal(fixture.writes[0].value.id, config.KIT_SETTINGS_ID);
    assert.equal(fixture.writes[0].value.isPublished, false);
    assert.equal(fixture.writes[0].value.showInMenu, false);
    assert.equal(fixture.writes[0].options.onConflict, 'id');
    resources[0].url = null; resources[0].localizedUrls = {};
    await fixture.settings.saveKitSettings(resources);
    assert.equal(config.getKitResourceUrl((await fixture.settings.readKitSettings()).resources[0], 'en'), null);
    fixture.fail();
    await assert.rejects(fixture.settings.readKitSettings());
    await assert.rejects(fixture.settings.saveKitSettings(resources));
    assert.deepEqual(await fixture.settings.readPublicKitResources(), []);
});

function routeFixture(deniedStatus = 0, failSave = false) {
    const storage = storageFixture(), invalidations = [];
    let bodyReads = 0;
    const api = load('app/api/admin/kit/route.ts', {
        'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
        'next/cache': { revalidatePath: path => invalidations.push(path) },
        '@/lib/admin-access': { requireRoutePermission: async () => { if (deniedStatus) throw { status: deniedStatus }; }, accessErrorResponse: error => ({ status: error.status }) },
        '@/lib/kit-config': config, '@/lib/kit-settings': { ...storage.settings, saveKitSettings: async rows => { if (failSave) throw Error('offline'); return storage.settings.saveKitSettings(rows); } },
    });
    return { api, storage, invalidations, patch: resources => api.PATCH({ json: async () => { bodyReads++; return { resources }; } }), bodyReads: () => bodyReads };
}

test('admin API forbids unauthorized writes before reading the body, reports validation/storage errors, and refreshes /kit on success', async () => {
    for (const denied of [401, 403]) {
        const fixture = routeFixture(denied);
        assert.equal((await fixture.patch(defaults())).status, denied);
        assert.equal(fixture.bodyReads(), 0);
        assert.equal(fixture.storage.writes.length, 0);
    }
    const invalid = routeFixture();
    assert.equal((await invalid.patch(null)).status, 400);
    assert.equal(invalid.storage.writes.length, 0);
    const failed = routeFixture(0, true);
    assert.equal((await failed.patch(defaults())).status, 503);
    assert.deepEqual(failed.invalidations, []);
    const good = routeFixture();
    assert.equal((await good.patch(defaults())).status, 200);
    assert.deepEqual(good.invalidations, ['/kit']);
    assert.equal((await good.api.GET({})).body.resources.length, defaults().length);
});

test('removing any main card, including all cards, persists after save and reload', async () => {
    const fixture = storageFixture();
    const remaining = defaults().filter(row => row.id !== 'brochure' && row.id !== 'contact');
    await fixture.settings.saveKitSettings(config.parseKitResources(remaining));
    assert.deepEqual((await fixture.settings.readKitSettings()).resources.map(row => row.id), remaining.map(row => row.id));
    await fixture.settings.saveKitSettings([]);
    assert.deepEqual(await fixture.settings.readPublicKitResources(), []);
});

test('legacy visit-kit cards become a heading without losing configured resource URLs', async () => {
    const fixture = storageFixture();
    const rows = [{ id: 'visits', tone: 'blue', url: null }, ...defaults()];
    rows[1].url = 'https://destekol.org/brochure.pdf';
    rows[2].localizedUrls = { ar: '/kit/portfolio-ar.pdf' };
    fixture.seed({ sections: [{ type: 'kit_links', props: { resources: rows } }] });
    const saved = (await fixture.settings.readKitSettings()).resources;
    assert.equal(saved.some(row => row.id === 'visits'), false);
    assert.equal(saved.find(row => row.id === 'brochure').url, 'https://destekol.org/brochure.pdf');
    assert.equal(saved.find(row => row.id === 'portfolio').localizedUrls.ar, '/kit/portfolio-ar.pdf');
    await fixture.settings.saveKitSettings(saved);
    assert.deepEqual((await fixture.settings.readKitSettings()).resources.map(row => row.id), saved.map(row => row.id));
});

test('contact links open safely in all languages and the official slogan appears once below a photo-only banner', () => {
    const React = require('react');
    const { renderToStaticMarkup } = require('react-dom/server');
    const copy = load('lib/kit-copy.ts');
    const KitPage = load('components/kit/KitPage.tsx', {
        'next/image': { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) },
        '@/lib/kit-config': config, '@/lib/kit-copy': copy,
        '@/lib/locales': { LOCALE_NAMES: { en: 'English', tr: 'Türkçe', ar: 'العربية' } },
        '@/lib/analytics': { trackKitResourceClick() {}, trackLanguageSelection() {} },
        './kit.module.css': { __esModule: true, default: new Proxy({}, { get: (_, name) => String(name) }) },
    }).default;
    for (const locale of ['en', 'tr', 'ar']) {
        const html = renderToStaticMarkup(React.createElement(KitPage, { initialLocale: locale, resources: defaults() }));
        assert.match(html, new RegExp(`href="/${locale}/contact"[^>]*target="_blank"[^>]*rel="noopener noreferrer"`));
        assert.ok(html.includes(copy.KIT_COPY[locale].pageHeading));
        assert.ok(html.includes('<h1 class="pageTitle">'));
        assert.ok(!html.includes('data-resource="visits"'));
        assert.equal(html.split(copy.KIT_COPY[locale].heroTitle).length - 1, 1);
        assert.ok(!html.includes('bannerCopy'));
        assert.ok(!html.includes(copy.KIT_COPY[locale].heroSubtitle));
    }
});

test('view-only staff can inspect kit settings but cannot change links through the API', () => {
    const permissions = load('lib/permissions.ts');
    const policy = load('lib/admin-policy.ts', { './permissions': permissions });
    const viewer = { role: 'VIEWER', isStaff: true, permissions: ['pages.view', 'pages.edit'] };
    assert.equal(policy.policyAllows(viewer, policy.adminPagePolicy('/admin/kit')), true);
    assert.equal(policy.policyAllows(viewer, policy.adminApiPolicy('/api/admin/kit', 'GET')), true);
    assert.equal(policy.policyAllows(viewer, policy.adminApiPolicy('/api/admin/kit', 'PATCH')), false);
});
