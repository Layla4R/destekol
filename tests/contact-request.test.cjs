const fs=require('fs');const ts=require('typescript');const assert=require('node:assert/strict');const test=require('node:test');const {createHash}=require('node:crypto');
function load(p,mocks={}){const m={exports:{}};const js=ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;new Function('require','module','exports',js)(x=>x in mocks?mocks[x]:require(x),m,m.exports);return m.exports;}
const request=body=>new Request('http://localhost/api/contact',{method:'POST',body:JSON.stringify(body)});
const body={name:'Fixture',email:'fixture@destekol.test',subject:'Private subject',message:'Private complaint',locale:'ar'};
test('save failure never returns success or sends a notice; durable save returns a reference-only receipt even if notification fails',async()=>{
 for(const [saveError,mailError,expected]of [[true,false,503],[false,true,200],[false,false,200]]){
  let saved,notified=0;const route=load('app/api/contact/route.ts',{'@/lib/supabase':{getSupabaseOrNull:()=>({from:()=>({insert:async row=>{saved=row;return {error:saveError?{}:null}}})})},'@/lib/request-limit':{enforceRequestLimit:async()=>null},'@/lib/contact-notifications':{notifyContact:async()=>{notified++;if(mailError)throw Error('SMTP unavailable');return 'SENT'}}});
  const res=await route.POST(request(body));assert.equal(res.status,expected);const d=await res.json();
  if(saveError){assert.equal(d.ok,undefined);assert.equal(notified,0)}else{assert(d.ok);assert.equal(saved.message,body.message);assert.equal(d.status,'RECEIVED');assert.match(d.reference,/^DO-[A-F0-9]{16}$/);assert.equal(new URLSearchParams(d.trackingUrl.split('#')[1]).get('reference'),d.reference);assert(!d.trackingUrl.includes('token='));assert.equal(saved.trackingTokenHash,undefined);assert.equal(res.headers.get('cache-control'),'no-store');}
 }
});
test('tracking works with only a reference and never selects private message fields',async()=>{
 const reference='DO-1234567890ABCDEF';
 for(const [ref,status]of [[reference,200],['DO-0000000000000000',404],['invalid',404]]){
  const filters={};let selected;
  const db={from:()=>({select(fields){selected=fields;return this},eq(k,v){filters[k]=v;return this},async maybeSingle(){return {data:filters.reference===reference?{reference,status:'IN_PROGRESS',createdAt:'2026-10-08',statusUpdatedAt:'2026-10-08'}:null,error:null}}})};
  const route=load('app/api/contact/status/route.ts',{'@/lib/supabase':{getSupabase:()=>db},'@/lib/request-limit':{enforceRequestLimit:async()=>null}});
  const r=await route.POST(request({reference:ref}));assert.equal(r.status,status);const d=await r.json();assert(!JSON.stringify(d).includes('email'));assert(!JSON.stringify(d).includes('message'));if(status===200){assert.equal(selected,'reference,status,createdAt,statusUpdatedAt');assert.equal(r.headers.get('cache-control'),'no-store');assert.deepEqual(filters,{reference});}
 }
});
test('notifications persist SMTP rejection, preserve a retry time and never include complaint contents',async()=>{
 for(const sent of [true,false]){
  let saved,mail;const helper=load('lib/contact-notifications.ts',{'./supabase':{getSupabase:()=>({rpc:async()=>({data:[{id:'fixture',reference:'DO-1234567890ABCDEF'}],error:null}),from:()=>({update(row){saved=row;return this},eq(){return this},then(resolve){return Promise.resolve(resolve({error:null}))}})})},'./public-contact':{officialEmail:()=> 'info@destekol.org'},'./mailer':{sendContactNotification:async opts=>{mail=opts;return sent}}});
  assert.equal(await helper.notifyContact('fixture'),sent?'SENT':'FAILED');assert.equal(saved.notificationStatus,sent?'SENT':'FAILED');assert.equal(saved.notificationLeaseUntil,null);assert(Date.parse(saved.notificationNextAttemptAt)>Date.now());assert(!JSON.stringify(mail).includes(body.message));assert(!JSON.stringify(mail).includes(body.email));
 }
});
test('an active lease or a sent notification prevents duplicate sending',async()=>{
 const helper=load('lib/contact-notifications.ts',{'./supabase':{getSupabase:()=>({rpc:async()=>({data:[],error:null})})},'./public-contact':{},'./mailer':{sendContactNotification(){assert.fail('No duplicate mail')}}});assert.equal(await helper.notifyContact('fixture',true),'PENDING');
});
test('SMTP rejection is not reported as delivery',async()=>{
 const mailer=load('lib/mailer.ts',{'./request-site':{getRequestSite:()=>({url:'https://destekol.org'}),siteEnv:()=>undefined},'./supabase':{getSupabaseOrNull:()=>({from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{smtpUser:'fixture-only',smtpPassword:'fixture-only',smtpFrom:'fixture@destekol.test'}})})})},nodemailer:{createTransport:()=>({sendMail:async()=>({accepted:[],rejected:['fixture@destekol.test']})})}});
 assert.equal(await mailer.sendMail({to:'fixture@destekol.test',subject:'Fixture',html:'Fixture'}),false);
});
