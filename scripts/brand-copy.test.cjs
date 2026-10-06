const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/destekol-brand-copy.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exportsObject = {};
new Function('exports', code)(exportsObject);
test('CMS branding changes editorial text without changing renderer or route identifiers', () => {
    const legacyName = ['4', 'Relief'].join('');
    const page = {
        id: 'destekol-home', slug: 'destekol-projects',
        sections: [{ type: 'destekol_achievements', props: {
            title: `${legacyName} achievements`,
            items: [{ id: 'destekol-impact', icon: 'projects', value: '100', title: `${legacyName} projects` }],
        } }],
    };
    const result = exportsObject.normalizeDestekolBrandCopy(page, 'en');
    assert.equal(result.id, page.id);
    assert.equal(result.slug, page.slug);
    assert.equal(result.sections[0].type, 'destekol_achievements');
    assert.equal(result.sections[0].props.items[0].id, 'destekol-impact');
    assert.equal(result.sections[0].props.items[0].icon, 'projects');
    assert.equal(result.sections[0].props.title, 'Destekol achievements');
    assert.equal(result.sections[0].props.items[0].title, 'Destekol projects');
    assert.equal(page.sections[0].props.title, `${legacyName} achievements`);
});
