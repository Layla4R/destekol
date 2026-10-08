const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}) {
 const mod = { exports: {} };
 const compiled = ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
 new Function('require','module','exports','React',compiled)(name => name in mocks ? mocks[name] : require(name),mod,mod.exports,React);
 return mod.exports;
}
const permissions = load('lib/permissions.ts');
function fixture(session, auditFail = false) {
 const events = [], touched = [], filters = [];
 const query = { select(){return this},order(){return this},limit(){return this},eq(k,v){filters.push([k,v]);return this},not(k,op,v){filters.push([k,op,v]);return this},ilike(){return this},or(){return this},update(){return this},delete(){return this},async maybeSingle(){return {data:{id:'complaint',isSensitive:true}}},then(resolve){return Promise.resolve(resolve({data:[],error:null}))} };
 const db = { from(table){if(table==='AdminAuditLog') return {async insert(event){events.push(event);return {error:auditFail?{}:null}}};touched.push(table);return query} };
 const access = load('lib/admin-access.ts', {'./auth':{getAdminSession:async()=>session},'./permissions':permissions,'./admin-policy':load('lib/admin-policy.ts',{'./permissions':permissions}),'./supabase':{getSupabase:()=>db},'./request-site':{getRequestSite:()=>({id:'destekol'})}});
 return {events,touched,filters,db,access};
}
const staff = (role, perms=[]) => ({id:'test-staff',email:'unused@example.invalid',role,isStaff:true,permissions:perms,site:'destekol'});
test('empty permissions deny access; VIEWER cannot export or mutate even with an explicit grant',()=>{
 assert.equal(permissions.hasPermission(staff('EDITOR'),'subscribers.export'),false);
 assert.equal(permissions.hasPermission(staff('VIEWER',['subscribers.export']),'subscribers.export'),false);
 assert.equal(permissions.hasPermission(staff('VIEWER',['messages.edit']),'messages.edit'),false);
 assert.equal(permissions.hasPermission(staff('EDITOR',['subscribers.export']),'subscribers.export'),true);
 assert.equal(permissions.hasPermission({role:'ADMIN',isStaff:false},'audit.view'),true);
});
test('all PII export endpoints deny VIEWER before touching private tables and record denial',async()=>{
 for(const [file,permission] of [['subscribers','subscribers.export'],['users','users.export'],['donations','donations.export']]){
  const f=fixture(staff('VIEWER',[permission]));
  const route=load(`app/api/admin/${file}/export/route.ts`,{'@/lib/admin-access':f.access,'@/lib/supabase':{getSupabase:()=>f.db}});
  const response=await route.GET(new Request(`http://localhost/api/admin/${file}/export`));
  assert.equal(response.status,403);assert.deepEqual(f.touched,[]);assert.equal(f.events[0].outcome,'DENY');
 }
});
test('authorized export is audited and never cached; anonymous and audit failures fail closed',async()=>{
 for(const [session,fail,status] of [[staff('EDITOR',['subscribers.export']),false,200],[null,false,401],[staff('EDITOR',['subscribers.export']),true,503]]){
  const f=fixture(session,fail),route=load('app/api/admin/subscribers/export/route.ts',{'@/lib/admin-access':f.access,'@/lib/supabase':{getSupabase:()=>f.db}});
  const response=await route.GET(new Request('http://localhost/api/admin/subscribers/export?q=private-search'));
  assert.equal(response.status,status);assert.equal(response.headers.get('cache-control'),'no-store');
  if(status===200)assert.deepEqual(f.events.map(e=>e.outcome),['ALLOW','SUCCESS']);else assert.deepEqual(f.touched,[]);
  assert(!JSON.stringify(f.events).includes('private-search'));
 }
});
test('editing a sensitive complaint requires both message access and specialist permission',async()=>{
 const f=fixture(staff('EDITOR',['messages.view','messages.edit']));
 const message=load('lib/message-access.ts',{'./admin-access':f.access,'./permissions':permissions,'./supabase':{getSupabase:()=>f.db}});
 await assert.rejects(()=>message.requireMessageAccess('complaint','messages.edit',new Request('http://localhost')),e=>e.status===403);
 assert.equal(f.events.at(-1).action,'messages.sensitive.view');assert.equal(f.events.at(-1).outcome,'DENY');
 const allowed=fixture(staff('EDITOR',['messages.view','messages.edit','messages.sensitive.view']));
 const specialist=load('lib/message-access.ts',{'./admin-access':allowed.access,'./permissions':permissions,'./supabase':{getSupabase:()=>allowed.db}});
 assert((await specialist.requireMessageAccess('complaint','messages.edit',new Request('http://localhost'))).id);
});
test('bulk read updates exclude sensitive complaints for non-specialists',async()=>{
 const f=fixture(staff('EDITOR',['messages.view','messages.edit']));
 const message=load('lib/message-access.ts',{'./admin-access':f.access,'./permissions':permissions,'./supabase':{getSupabase:()=>f.db}});
 const route=load('app/api/admin/messages/mark-all-read/route.ts',{'@/lib/admin-access':f.access,'@/lib/message-access':message,'@/lib/supabase':{getSupabase:()=>f.db}});
 const response=await route.POST(new Request('http://localhost/api/admin/messages/mark-all-read',{method:'POST'}));
 assert.equal(response.status,200);assert(f.filters.some(([k,v])=>k==='isSensitive'&&v===false));assert.equal(f.events.at(-1).outcome,'SUCCESS');
});
test('staff cannot modify roles to grant themselves access',async()=>{
 const f=fixture(staff('EDITOR',['staff.manage']));
 const route=load('app/api/admin/users/[id]/route.ts',{'@/lib/admin-access':f.access,'@/lib/auth':{requireSuperAdmin:async()=>{throw Error('UNAUTHORIZED')}},'@/lib/permissions':permissions,'@/lib/supabase':{getSupabase:()=>f.db}});
 const response=await route.PATCH(new Request('http://localhost/api/admin/users/target',{method:'PATCH',body:JSON.stringify({isStaff:false,role:'ADMIN'})}),{params:{id:'target'}});
 assert.equal(response.status,403);assert.deepEqual(f.touched,[]);
});
test('message list and unread count both exclude sensitive data for general-message staff',async()=>{
 const f=fixture(staff('EDITOR',['messages.view']));
 const q={select(){return this},order(){return this},eq(k,v){f.filters.push([k,v]);return this},async range(){return {data:[],count:0}},then(resolve){return Promise.resolve(resolve({data:[],count:0}))}};
 const page=load('app/admin/(panel)/messages/page.tsx',{'@/components/icons':()=>null,'@/lib/admin-access':f.access,'@/lib/permissions':permissions,'@/lib/supabase':{getSupabase:()=>({from:()=>q})},'next/navigation':{redirect:()=>{throw Error('redirect')}},'./MarkAllReadButton':()=>null,'./MessageActions':()=>null}).default;
 renderToStaticMarkup(await page({searchParams:{}}));
 assert.equal(f.filters.filter(([k,v])=>k==='isSensitive'&&v===false).length,2);
});
test('activation logs never include tokens and notification email excludes complaint content',()=>{
 const auth=fs.readFileSync('lib/donorAuth.ts','utf8');
 for(const line of auth.split('\n').filter(l=>/console\./.test(l)))assert(!/\btoken\b|opts\.email|error\.message|updateError\.message/.test(line));
 const contact=fs.readFileSync('app/api/contact/route.ts','utf8');
 assert.match(contact,/subject: subject\?\.trim\(\) \|\| null,\s*message: message\.trim\(\)/);
 const notification=fs.readFileSync('lib/contact-notifications.ts','utf8');
 assert.match(notification,/subject: 'New message in the admin dashboard',\s*message: `A new message/);
 assert(!/row\.(message|name|email)/.test(notification));
});
test('session roles and permissions come from the current database, not stale JWT claims',async()=>{
 const {SignJWT}=require('jose');const secret=new TextEncoder().encode('test-only-session-secret-1234567890123456');
 const token=await new SignJWT({email:'staff@example.invalid',role:'ADMIN',permissions:['subscribers.export'],site:'destekol'}).setProtectedHeader({alg:'HS256'}).setExpirationTime('1h').sign(secret);
 let current={id:'staff',email:'staff@example.invalid',role:'VIEWER',isStaff:true,permissions:['users.view']};
 const auth=load('lib/auth.ts',{'next/headers':{cookies:()=>({get:()=>({value:token})})},'./request-site':{getRequestSite:()=>({id:'destekol'})},'./session-secret':{getSessionSecret:()=>secret},'./supabase':{getSupabase:()=>({from:()=>({select(){return this},eq(){return this},async maybeSingle(){return {data:current,error:null}}})})},'./tenant':{isSiteSession:(p,s)=>p.site===s}});
 let session=await auth.getAdminSession();assert.equal(session.role,'VIEWER');assert.equal(permissions.hasPermission(session,'subscribers.export'),false);
 current={...current,permissions:[]};session=await auth.getAdminSession();assert.equal(permissions.hasPermission(session,'users.view'),false);
 current={...current,role:'FINANCE',accessExpiresAt:'2000-01-01T00:00:00Z'};assert.equal(await auth.getAdminSession(),null);
 current={...current,accessExpiresAt:'2099-01-01T00:00:00Z'};assert.equal((await auth.getAdminSession()).role,'FINANCE');
 current={...current,role:'DONOR',isStaff:false};assert.equal(await auth.getAdminSession(),null);
});

test('explicit roles follow assigned permissions and route policies separate reads, edits and exports',()=>{
 const policy=load('lib/admin-policy.ts',{'./permissions':permissions});
 assert.equal(permissions.hasPermission(staff('FINANCE',permissions.PRESET_ROLES.finance_manager.permissions),'donations.export'),true);
 assert.equal(permissions.hasPermission(staff('COMPLAINTS',permissions.PRESET_ROLES.complaints_officer.permissions),'messages.sensitive.view'),true);
 assert.equal(policy.policyAllows(staff('VIEWER',permissions.PRESET_ROLES.viewer.permissions),policy.adminPagePolicy('/admin/campaigns/id')),false);
 assert.equal(policy.adminApiPolicy('/api/admin/campaigns','POST').permission,'campaigns.create');
 assert.equal(policy.adminApiPolicy('/api/admin/campaigns/id','DELETE').permission,'campaigns.delete');
 assert.equal(policy.adminApiPolicy('/api/admin/campaigns/export').permission,'campaigns.export');
 assert.equal(policy.policyAllows(staff('ADMIN',['staff.manage']),policy.adminPagePolicy('/admin/staff')),false);
 assert.equal(policy.adminLanding(staff('FINANCE',permissions.PRESET_ROLES.finance_manager.permissions)),'/admin/donations');
 assert.equal(policy.adminLanding(staff('COMPLAINTS',permissions.PRESET_ROLES.complaints_officer.permissions)),'/admin/messages');
});
