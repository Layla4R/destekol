const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../lib/destekol-homepage.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
new Function('exports', compiled)(exportsObject);

test('home project block reads the published projects Page without changing manual blocks', () => {
    const shared = [{ title: 'مشروع منشور', buttonLink: '/ar/project' }];
    const home = [
        { id: 'shared', type: 'projects', props: { title: 'من الأدمن', items: [] } },
        { id: 'manual', type: 'projects', props: { source: 'manual', items: [{ title: 'خاص' }] } },
    ];
    const result = exportsObject.attachProjectPageItems(home, [{ id: 'catalogue', type: 'projects', props: { items: shared } }]);
    assert.deepEqual(result[0].props.items, shared);
    assert.equal(result[0].props.title, 'من الأدمن');
    assert.deepEqual(result[1], home[1]);
    assert.deepEqual(home[0].props.items, []);
});

test('missing or unpublished catalogue contributes no invented cards', () => {
    const home = [{ id: 'shared', type: 'projects', props: { source: 'projects-page', items: [{ title: 'stale' }] } }];
    assert.deepEqual(exportsObject.attachProjectPageItems(home, [])[0].props.items, []);
});

test('linked project headings use CMS catalogue copy when the home fields are empty', () => {
    const home = [{ id: 'shared', type: 'projects', props: { source: 'projects-page', title: '', subtitle: '' } }];
    const catalogue = [{ id: 'catalogue', type: 'projects', props: { title: 'Our projects', subtitle: 'Field work', items: [{ title: 'Water' }] } }];
    const result = exportsObject.attachProjectPageItems(home, catalogue)[0];
    assert.equal(result.props.title, 'Our projects');
    assert.equal(result.props.subtitle, 'Field work');
    assert.equal(result.props.items.length, 1);
    assert.equal(home[0].props.title, '');
});
