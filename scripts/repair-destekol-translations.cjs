/** Apply reviewed CMS copy repairs only to the Destekol tenant.
 * node scripts/repair-destekol-translations.cjs [--apply]
 * Dry-run by default. Backs up all affected rows before any writes. Leaf hashes
 * and row timestamps prevent overwriting intervening administrator edits.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');
const manifest = require('./data/destekol-translation-repairs.json');
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
const allowed = new Set(['Page', 'PageTranslation', 'NewsPost', 'NewsPostTranslation', 'Campaign', 'CampaignTranslation']);
const columns = new Set(['title', 'description', 'sections', 'body', 'body2', 'body3', 'summary', 'excerpt']);

async function main() {
  if (manifest.schema !== 'destekol') throw new Error('Destekol schema required');
  loadEnvConfig(path.resolve(__dirname, '..'));
  const db = createClient(process.env.SUPABASE_DATABASE_URL || process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { db: { schema: 'destekol' }, auth: { persistSession: false } });
  const planned = [];
  for (const repair of manifest.repairs) {
    if (!allowed.has(repair.table)) throw new Error('Unexpected table');
    const { data: row, error } = await db.from(repair.table).select('*').eq('id', repair.id).single();
    if (error) throw error;
    const next = structuredClone(row), changed = new Set();
    for (const edit of repair.edits) {
      if (!columns.has(edit.path[0]) || edit.path.some(k => ['__proto__', 'constructor', 'prototype'].includes(k))) throw new Error('Unexpected field');
      const current = edit.path.reduce((v, k) => v?.[k], row);
      if (hash(current) === hash(edit.value)) continue;
      if (hash(current) !== edit.beforeHash) throw new Error(`Admin edit detected: ${repair.table}/${repair.id}/${edit.path.join('.')}`);
      let target = next;
      for (const key of edit.path.slice(0, -1)) target = target[key];
      target[edit.path.at(-1)] = edit.value;
      changed.add(edit.path[0]);
    }
    if (changed.size) planned.push({ table: repair.table, row, patch: Object.fromEntries([...changed].map(k => [k, next[k]])) });
  }
  console.log(`Destekol CMS rows to repair: ${planned.length}`);
  if (!process.argv.includes('--apply') || !planned.length) return;
  const backupDir = path.resolve(__dirname, '../../review-artifacts');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, `destekol-copy-backup-${Date.now()}.json`);
  fs.writeFileSync(backup, JSON.stringify(planned, null, 2), { flag: 'wx' });
  console.log(`Backup: ${backup}`);
  for (const { table, row, patch } of planned) {
    let query = db.from(table).update({ ...patch, ...('updatedAt' in row ? { updatedAt: new Date().toISOString() } : {}) }).eq('id', row.id);
    if (row.updatedAt) query = query.eq('updatedAt', row.updatedAt);
    else for (const field of Object.keys(patch)) query = row[field] == null ? query.is(field, null) : query.eq(field, typeof row[field] === 'object' ? JSON.stringify(row[field]) : row[field]);
    const { data, error } = await query.select('id');
    if (error) throw error;
    if (data.length !== 1) throw new Error(`Concurrent edit detected: ${table}/${row.id}. Backup preserved.`);
  }
  console.log(`Applied ${planned.length} CMS repairs. Repeat dry-run to verify idempotence.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
