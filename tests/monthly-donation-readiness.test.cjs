const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),{test}=require('node:test'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(file,mocks={}){const m={exports:{}};const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;new Function('require','module','exports',js)(key=>key in mocks?mocks[key]:require(key),m,m.exports);return m.exports;}
const copy=load('lib/monthly-donation-copy.ts'),lifecycle=load('lib/payment-lifecycle.ts'),recurring=load('lib/recurring-donations.ts',{'./payment-lifecycle':lifecycle});
test('monthly disclosure states the recurring amount, unknown first date, duration, authorization and cancellation/refund distinction in every language',()=>{
 const Disclosure=load('components/site/MonthlyDonationDisclosure.tsx',{'@/lib/monthly-donation-copy':copy}).default;
 for(const locale of ['ar','tr','en','fr']){const text=copy.getMonthlyDonationCopy(locale),html=renderToStaticMarkup(React.createElement(Disclosure,{locale,amount:25,currency:'USD'}));for(const key of ['first','cycle','authorization','cancellation','refund','unavailable'])assert(html.includes(text[key]));assert(html.includes(text.perMonth));assert(html.includes(`/${locale}/account/donations`));assert(html.includes('info@destekol.org'));assert(!html.includes('<input'));}
 assert.equal(recurring.RECURRING_SERVICE_AVAILABLE,false);
});
const plan={version:'fixture-v1',amount:25,currency:'USD',frequency:'MONTHLY',firstChargeAt:'2027-01-15T10:00:00+03:00',timeZone:'Europe/Istanbul',billingSchedule:'Each month on the 15th; confirmed provider terms',duration:'UNTIL_CANCELLED',cancellationTerms:'Confirmed effective-date rule',providerApproved:true,cancellationTested:true};
const consent={donorId:'fixture',locale:'tr',recurringAccepted:true,acceptedPlanVersion:'fixture-v1'};
test('authorization cannot be prepared without exact recurring consent and provider-approved schedule/cancellation terms',()=>{
 for(const change of [{providerApproved:false},{cancellationTested:false},{firstChargeAt:''},{billingSchedule:''},{cancellationTerms:''},{timeZone:'invalid'},{amount:0},{currency:'INVALID'}])assert.throws(()=>recurring.createMonthlyAuthorizationRecord({...plan,...change},consent,new Date('2026-10-09T00:00:00Z')));
 for(const change of [{recurringAccepted:false},{acceptedPlanVersion:'old'},{donorId:''}])assert.throws(()=>recurring.createMonthlyAuthorizationRecord(plan,{...consent,...change},new Date('2026-10-09T00:00:00Z')));
 const record=recurring.createMonthlyAuthorizationRecord(plan,consent,new Date('2026-10-09T00:00:00Z'));assert.equal(record.subscriptionStatus,'PENDING_AUTHORIZATION');assert.equal(record.planSnapshot.amount,25);assert.equal(record.planSnapshot.currency,'USD');assert.equal(record.consentAt,'2026-10-09T00:00:00.000Z');
});
test('unconfirmed cancellation never becomes CANCELLED or REFUNDED; confirmed cancellation leaves payment state untouched',()=>{
 for(const response of [{confirmed:false},{confirmed:true},{confirmed:true,providerReference:'fixture',effectiveAt:'invalid'}])assert.equal(recurring.cancellationDecision('ACTIVE',response).subscriptionStatus,'CANCELLATION_PENDING');
 const result=recurring.cancellationDecision('ACTIVE',{confirmed:true,providerReference:'fixture',effectiveAt:'2026-10-09T12:00:00Z'});assert.equal(result.subscriptionStatus,'CANCELLED');assert(!('status' in result));assert(!('refundedAmount' in result));assert.equal(recurring.cancellationDecision('CANCELLED',{}).subscriptionStatus,'CANCELLED');
});
function cancellationFixture(donor,data,error=null){let queries=0,filters=[];const route=load('app/api/donor/cancel-subscription/route.ts',{'@/lib/donorAuth':{getCurrentDonor:async()=>donor},'@/lib/supabase':{getSupabase:()=>({from:()=>{queries++;return{select(){return this},eq(k,v){filters.push([k,v]);return this},maybeSingle:async()=>({data,error})}}})}});return{route,queries:()=>queries,filters};}
const request=id=>new Request('http://localhost/api/donor/cancel-subscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({donationId:id})});
test('cancellation requires a donor session and ownership, and remains unavailable without changing any payment',async()=>{
 let f=cancellationFixture(null,null);assert.equal((await f.route.POST(request('fixture'))).status,401);assert.equal(f.queries(),0);
 f=cancellationFixture({email:'fixture@example.test'},null);assert.equal((await f.route.POST(request('other'))).status,404);assert(f.filters.some(([k,v])=>k==='donorEmail'&&v==='fixture@example.test'));
 f=cancellationFixture({email:'fixture@example.test'},{id:'fixture',frequency:'MONTHLY',subscriptionStatus:'ACTIVE'});const response=await f.route.POST(request('fixture'));assert.equal(response.status,503);assert.equal((await response.json()).error,'RECURRING_NOT_AVAILABLE');assert.equal(response.headers.get('Cache-Control'),'no-store');
});
