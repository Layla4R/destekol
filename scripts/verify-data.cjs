// Read-only verification: checks table access and counts without retrieving user records.
require('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
async function main() {
  const api = process.env.SUPABASE_DATABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!api || !key) throw new Error('Database configuration is missing');
  const url = new URL(api);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')) throw new Error('Unexpected database API host');
  for (const table of ['Page', 'PageTranslation', 'Campaign', 'NewsPost', 'SiteSettings', 'NewsCategory']) {
    const response = await fetch(new URL(`/rest/v1/${table}?select=id`, url), {
      method: 'HEAD', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Accept-Profile': 'destekol', Prefer: 'count=exact' },
    });
    // NewsCategory uses a slug primary key instead of id.
    if (table === 'NewsCategory' && response.status === 400) {
      const retry = await fetch(new URL('/rest/v1/NewsCategory?select=slug', url), { method: 'HEAD', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { apikey: key, Authorization: `Bearer ${key}`, 'Accept-Profile': 'destekol', Prefer: 'count=exact' } });
      if (!retry.ok) throw new Error(`${table}: HTTP ${retry.status}`);
      console.log(`${table}: accessible, rows ${retry.headers.get('content-range')?.split('/').pop() || 'unknown'}`);
      continue;
    }
    if (!response.ok) throw new Error(`${table}: HTTP ${response.status}`);
    console.log(`${table}: accessible, rows ${response.headers.get('content-range')?.split('/').pop() || 'unknown'}`);
  }
}
main().catch(() => { console.error('Read-only data verification failed. Check the database credentials, schema exposure and table access.'); process.exitCode = 1; });
