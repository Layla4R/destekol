const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'lib/public-site-settings.ts'), 'utf8');
const loaded = { exports: {} };
new Function('exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(loaded.exports);
const { pickPublicSiteSettings, PUBLIC_SITE_SETTINGS_SELECT } = loaded.exports;

test('serialized public settings exclude credentials and future private fields', () => {
  const row = { logoText: 'Example', logoImage: '/logo.png', accentColor: '#123456', whatsappNumber: null,
    smtpPassword: 'FAKE_SMTP_SECRET', stripeSecretKey: 'FAKE_STRIPE_SECRET',
    paypalClientSecret: 'FAKE_PAYPAL_SECRET', futurePrivateKey: 'FAKE_FUTURE_SECRET' };
  const projected = pickPublicSiteSettings(row);
  assert.deepEqual(projected, { logoText: 'Example', logoImage: '/logo.png', accentColor: '#123456', whatsappNumber: null });
  assert.doesNotMatch(JSON.stringify(projected), /FAKE_|smtpPassword|stripeSecretKey|paypalClientSecret|futurePrivateKey/);
  assert.equal(row.smtpPassword, 'FAKE_SMTP_SECRET');
});

test('invalid and nested values cannot carry private data through public fields', () => {
  assert.equal(pickPublicSiteSettings(null), null);
  assert.equal(pickPublicSiteSettings([]), null);
  assert.deepEqual(pickPublicSiteSettings({ logoText: { secret: 'FAKE_NESTED_SECRET' } }), {});
  assert.deepEqual(pickPublicSiteSettings(Object.create({ logoText: 'inherited' })), {});
});

test('public layout selects and projects settings before passing them to clients', () => {
  const layout = fs.readFileSync(path.join(root, 'app/[locale]/layout.tsx'), 'utf8');
  assert.match(layout, /\.from\("SiteSettings"\)\s*\.select\(PUBLIC_SITE_SETTINGS_SELECT\)/);
  assert.match(layout, /pickPublicSiteSettings\(result\.data\)/);
  assert.doesNotMatch(PUBLIC_SITE_SETTINGS_SELECT, /\*|smtp|secret|password/i);
});
