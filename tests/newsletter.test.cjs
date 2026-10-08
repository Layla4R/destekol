const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict'),test=require('node:test');
function load(p,mocks={}){const m={exports:{}};const js=ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;new Function('require','module','exports',js)(x=>x in mocks?mocks[x]:require(x),m,m.exports);return m.exports;}
const req=body=>new Request('http://localhost/api/newsletter',{method:'POST',body:JSON.stringify(body)});
const consent=load('lib/newsletter-consent.ts');
test('newsletter requires deliberate consent and saves its exact server-owned wording before email',async()=>{
 for(const [choice,saveError,expected] of [[false,false,400],[true,true,503],[true,false,200]]){
 let saved=null,mailed=false;const route=load('app/api/newsletter/route.ts',{'@/lib/request-limit':{enforceRequestLimit:async()=>null},'@/lib/newsletter-consent':consent,'@/lib/request-site':{getRequestSite:()=>({url:'https://destekol.org'})},'@/lib/newsletter-token':{newsletterToken:async()=> 'signed-token'},'@/lib/supabase':{getSupabase:()=>({rpc:async(name,args)=>{saved=args;return {error:saveError?{}:null,data:saveError?null:[{id:'fixture',unsubscribeKey:'key'}]}}})},'@/lib/mailer':{sendNewsletterWelcome:async(to,url)=>{assert(saved);assert.equal(url,'https://destekol.org/fr/unsubscribe#token=signed-token');mailed=true;return false}}});
 const response=await route.POST(req({email:' Fixture@destekol.test ',locale:'fr',marketingConsent:choice,consentVersion:consent.NEWSLETTER_CONSENT_VERSION}));assert.equal(response.status,expected);if(!choice)assert.equal(saved,null);if(expected===200){assert(mailed);assert.equal(saved.p_email,'fixture@destekol.test');assert.equal(saved.p_text,consent.newsletterConsentText.fr);assert.equal((await response.json()).ok,true);}else assert(!mailed);
 }
});
test('cancellation rejects unsigned links and never reports database failure as success',async()=>{
 for(const [token,dbError,result,status]of [['invalid',false,true,400],['signed',true,true,503],['signed',false,false,400],['signed',false,true,200]]){
 let calls=0;const route=load('app/api/newsletter/unsubscribe/route.ts',{'@/lib/request-limit':{enforceRequestLimit:async()=>null},'@/lib/newsletter-token':{verifyNewsletterToken:async t=>{if(t!=='signed')throw Error();return{id:'fixture',key:'fixture-key'}}},'@/lib/supabase':{getSupabase:()=>({rpc:async(name,args)=>{calls++;assert.equal(name,'unsubscribe_newsletter');assert.deepEqual(args,{p_id:'fixture',p_key:'fixture-key'});return{data:result,error:dbError?{}:null}}})}});
 const response=await route.POST(req({token}));assert.equal(response.status,status);if(token==='invalid')assert.equal(calls,0);
 }
});
test('newsletter token signature is purpose-bound, tenant-bound and cannot be changed',async()=>{
 process.env.SUPABASE_JWT_SECRET='test-only-secret-for-unit-tests-never-production';
 const tokenModule=load('lib/newsletter-token.ts',{'./request-site':{getRequestSite:()=>({schema:'destekol'})}});
 const token=await tokenModule.newsletterToken('fixture','key');assert.deepEqual(await tokenModule.verifyNewsletterToken(token),{id:'fixture',key:'key'});
 await assert.rejects(()=>tokenModule.verifyNewsletterToken(token.slice(0,-8)+'aaaaaaaa'));
 const {SignJWT}=require('jose');const wrong=await new SignJWT({key:'key'}).setProtectedHeader({alg:'HS256'}).setSubject('fixture').setIssuer('admin-session').setAudience('destekol').sign(new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET));await assert.rejects(()=>tokenModule.verifyNewsletterToken(wrong));
});
test('marketing exports exclude withdrawals and historical unverified consent',()=>{const s=fs.readFileSync('app/api/admin/subscribers/export/route.ts','utf8');assert(s.includes('.eq("active",true).not("consentAt","is",null)'));});
