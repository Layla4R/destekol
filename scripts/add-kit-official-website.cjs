// Run only after deploying support for the website resource ID. Dry-run is default.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');

async function main() {
    require('@next/env').loadEnvConfig(process.cwd());
    const configModule = { exports: {} };
    const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/kit-config.ts'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    new Function('module', 'exports', source)(configModule, configModule.exports);
    const { KIT_SETTINGS_ID, KIT_RESOURCES, parseKitResources } = configModule.exports;
    const url = process.env.SUPABASE_DATABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw Error('Supabase server configuration is missing');
    const db = createClient(url, key, { db: { schema: 'destekol' }, auth: { persistSession: false } });
    const { data: row, error } = await db.from('Page').select('id,sections,updatedAt').eq('id', KIT_SETTINGS_ID).single();
    if (error) throw Error('Cannot read the existing Kit record');
    const section = row.sections?.find(item => item.type === 'kit_links');
    if (!section || !Array.isArray(section.props?.resources)) throw Error('Existing Kit settings are invalid');
    if (section.props.resources.some(item => item.id === 'website')) {
        console.log('Website resource already exists; no saved links were changed.');
        return;
    }
    const remaining = section.props.resources.filter(item => item.id !== 'visits');
    const resources = [structuredClone(KIT_RESOURCES.find(item => item.id === 'website')), ...remaining];
    parseKitResources(resources); // Validate without rewriting any existing resources.
    console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'dry-run', before: remaining.map(item => item.id), after: resources.map(item => item.id) }));
    if (!process.argv.includes('--apply')) return;
    const backupDir = path.join(process.cwd(), 'private');
    fs.mkdirSync(backupDir, { recursive: true });
    fs.writeFileSync(path.join(backupDir, `kit-links-before-website-${Date.now()}.json`), JSON.stringify(row, null, 2));
    const sections = row.sections.map(item => item === section ? { ...item, props: { ...item.props, resources } } : item);
    let update = db.from('Page').update({ sections, updatedAt: new Date().toISOString() }).eq('id', KIT_SETTINGS_ID);
    update = row.updatedAt ? update.eq('updatedAt', row.updatedAt) : update.is('updatedAt', null);
    const { data: saved, error: saveError } = await update.select('sections').single();
    if (saveError || !saved) throw Error('Kit was not updated; it may have changed concurrently. Read it again before retrying.');
    const { data: verified, error: readError } = await db.from('Page').select('sections').eq('id', KIT_SETTINGS_ID).single();
    if (readError) throw Error('Update completed but verification could not read the record');
    const verifiedResources = verified.sections.find(item => item.type === 'kit_links').props.resources;
    assert.deepEqual(verifiedResources, resources);
    assert.deepEqual(verifiedResources.slice(1), remaining);
    console.log('Verified: official website first; all remaining saved resources preserved exactly.');
}

main().catch(() => { console.error('Kit website update failed. No credentials or private row contents are printed.'); process.exitCode = 1; });
