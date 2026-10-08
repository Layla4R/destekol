const fs = require('node:fs');
const ts = require('typescript');
const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
function load(file, mocks={}) {
 const mod={exports:{}};
 const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText;
 new Function('require','module','exports','React',compiled)(name=>name in mocks?mocks[name]:require(name),mod,mod.exports,React);
 return mod.exports;
}
function form(node){if(node?.type==='form')return node;for(const child of React.Children.toArray(node?.props?.children)){const found=form(child);if(found)return found;}}
test('login loads a fresh document at the permitted page and clears the previous account cache',async()=>{
 const savedFetch=global.fetch,savedWindow=global.window;
 try {
  for(const destination of ['/admin','/admin/pages','/admin/donations','/admin/messages','/admin/forbidden']) {
   const events=[];const states=[];
   global.window={location:{replace:path=>events.push(['navigate',path])}};
   global.fetch=async()=>({ok:true,json:async()=>({token:'test-token',redirectTo:destination})});
   const Page=load('app/admin/login/page.tsx',{'react':{...React,useState:value=>[value,next=>states.push(next)]},'@/components/admin/AdminBranding':{useAdminBranding:()=>({logo:'/logo.png',name:'Destekol'})},'@/components/icons':()=>null,'next/image':()=>null,'@/lib/admin-fetch':{clearAdminToken:()=>events.push(['clear']),storeAdminToken:token=>events.push(['store',token])}}).default;
   await form(Page()).props.onSubmit({preventDefault(){}});
   assert.deepEqual(events,[['clear'],['store','test-token'],['navigate',destination]]);
   assert.equal(states.at(-1),true,'keep submit disabled until the document loads');
  }
 }finally{global.fetch=savedFetch;global.window=savedWindow;}
});
test('failed login stays on the form and never replaces the active session',async()=>{
 const savedFetch=global.fetch,savedWindow=global.window;const states=[];
 try{
  global.window={location:{replace(){assert.fail('must not navigate')}}};
  global.fetch=async()=>({ok:false,json:async()=>({error:'Invalid email or password.'})});
  const Page=load('app/admin/login/page.tsx',{'react':{...React,useState:value=>[value,next=>states.push(next)]},'@/components/admin/AdminBranding':{useAdminBranding:()=>({logo:'/logo.png',name:'Destekol'})},'@/components/icons':()=>null,'next/image':()=>null,'@/lib/admin-fetch':{clearAdminToken(){assert.fail('must not clear')},storeAdminToken(){assert.fail('must not store')}}}).default;
  await form(Page()).props.onSubmit({preventDefault(){}});
  assert(states.includes('Invalid email or password.'));assert.equal(states.at(-1),false);
 }finally{global.fetch=savedFetch;global.window=savedWindow;}
});
test('login endpoint uses current permissions to return a direct role landing page',async()=>{
 const permissions=load('lib/permissions.ts'),policy=load('lib/admin-policy.ts',{'./permissions':permissions});
 for(const [role,preset,path]of [['ADMIN',null,'/admin'],['VIEWER','viewer','/admin/pages'],['EDITOR','editor','/admin/pages'],['FINANCE','finance_manager','/admin/donations'],['COMPLAINTS','complaints_officer','/admin/messages']]){
  const user={email:'fixture@destekol.test',role,isStaff:role!=='ADMIN',permissions:preset?permissions.PRESET_ROLES[preset].permissions:[],passwordHash:'test-only'};
  const route=load('app/api/admin/auth/login/route.ts',{'@/lib/admin-policy':policy,'@/lib/auth':{createAdminSession:async()=> 'test-token'},'@/lib/session-secret':{getSessionSecret:()=>new Uint8Array(32)},'bcryptjs':{compare:async()=>true},'@/lib/supabase':{getSupabase:()=>({from:()=>({select(columns){assert(columns.includes('permissions'));return this},eq(){return this},maybeSingle:async()=>({data:user,error:null})})})}});
  const r=await route.POST(new Request('http://localhost/api/admin/auth/login',{method:'POST',body:JSON.stringify({email:user.email,password:'fixture-only'})}));
  assert.equal(r.status,200);assert.equal((await r.json()).redirectTo,path);assert.equal(r.headers.get('cache-control'),'no-store');
 }
 assert(!/console\./.test(fs.readFileSync('app/admin/login/page.tsx','utf8')),'never log the returned session token');
});
