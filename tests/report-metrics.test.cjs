const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),{test}=require('node:test'),{NextRequest}=require('next/server');
function load(file,mocks={}){const m={exports:{}};const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;new Function('require','module','exports',source)(key=>key in mocks?mocks[key]:require(key),m,m.exports);return m.exports;}
const metrics=load('lib/public-metrics.ts');
const documented={value:'95%',title:'Field support',metricKind:'ACTUAL',sourceName:'Approved annual report',methodology:'Eligible expenditure / total expenditure × 100',periodStart:'2025-01-01',periodEnd:'2025-12-31',approvedBy:'Internal approver',approvedOn:'2026-01-01',publicationApproved:true};
test('evidence requires an approved source, method, valid period and explicit target/result classification',()=>{
 assert(metrics.isPublishableMetric(documented));
 for(const field of ['sourceName','methodology','metricKind','approvedBy','periodStart','periodEnd','approvedOn'])assert.equal(metrics.isPublishableMetric({...documented,[field]:''}),false);
 assert.equal(metrics.isPublishableMetric({...documented,periodEnd:'2025-02-30'}),false);
 assert.equal(metrics.isPublishableMetric({...documented,publicationApproved:false}),false);
 assert.equal(metrics.isPublishableMetric({...documented,periodEnd:'2099-01-01'}),false);
 assert(metrics.isPublishableMetric({...documented,metricKind:'TARGET',periodEnd:'2099-01-01'}));
 assert.equal(metrics.publicMetricSourceUrl('javascript:alert(1)'),undefined);
});
test('translated metric facts stay canonical while source wording and methodology can be translated',()=>{
 const cms=load('lib/cms-localization.ts'),base=[{id:'metrics',type:'destekol_achievements',props:{items:[{...documented,icon:'heart'}]}}];
 const trans=JSON.parse(JSON.stringify(base));Object.assign(trans[0].props.items[0],{value:'100%',metricKind:'TARGET',sourceName:'Rapport annuel',methodology:'Méthode française'});
 const merged=cms.mergeCmsTranslation(base,trans)[0].props.items[0];assert.equal(merged.value,'95%');assert.equal(merged.metricKind,'ACTUAL');assert.equal(merged.sourceName,'Rapport annuel');
 const legacy=[{id:'metrics',type:'stats',props:{items:[{value:'95%',title:'Field support'}]}}],submitted=cms.mergeCmsTranslation(legacy,legacy);Object.assign(submitted[0].props.items[0],documented);
 const updated=cms.applyCmsSharedEdits(legacy,legacy,submitted)[0].props.items[0];assert.equal(updated.metricKind,'ACTUAL');assert.equal(updated.publicationApproved,true);
});
function reportFixture(error=false){const now=new Date().toISOString(),rows=[...Array.from({length:501},(_,i)=>({id:String(i),amount:0.01,refundedAmount:0,status:'COMPLETED',currency:'usd',isTest:false,frequency:'ONE_TIME',createdAt:now,provider:'PAYTR'})),{id:'full',amount:20,refundedAmount:20,status:'REFUNDED',currency:'usd',isTest:false,createdAt:now,provider:'PAYTR'},{id:'partial',amount:10,refundedAmount:3,status:'COMPLETED',currency:'usd',isTest:false,createdAt:now,provider:'PAYTR'},{id:'test',amount:100,status:'COMPLETED',currency:'usd',isTest:true,createdAt:now},{id:'pending',amount:100,status:'PENDING',currency:'usd',isTest:false,createdAt:now},{id:'try',amount:100,status:'COMPLETED',currency:'try',isTest:false,createdAt:now}];let pages=0;
 const db={from:()=>({filters:{},start:0,end:0,select(){return this},in(k,v){this.filters[k]=v;return this},eq(k,v){this.filters[k]=v;return this},gte(k,v){this.after=v;return this},lte(){return this},lt(k,v){this.before=v;return this},order(){return this},range(a,b){this.start=a;this.end=b;pages++;return this},then(resolve){return Promise.resolve(resolve({error:error?{}:null,data:rows.filter(r=>this.filters.status.includes(r.status)&&r.currency===this.filters.currency&&r.isTest===this.filters.isTest&&r.createdAt>=this.after&&(!this.before||r.createdAt<this.before)).slice(this.start,this.end+1)}));}})};
 const route=load('app/api/admin/reports/route.ts',{'@/lib/supabase':{getSupabase:()=>db},'@/lib/admin-access':{requirePermission:async()=>({}),accessErrorResponse:()=>new Response('',{status:403})}});return{route,pages:()=>pages};}
test('report includes full and partial refunds, separates gross/refunds/net, and pages beyond first 500 rows',async()=>{
 const f=reportFixture(),response=await f.route.GET(new NextRequest('http://localhost/api/admin/reports?currency=USD&period=7')),data=await response.json();assert.equal(response.status,200);assert.equal(data.grossDonations,35.01);assert.equal(data.totalRefunds,23);assert.equal(data.netDonations,12.01);assert.equal(data.donationCount,503);assert.equal(data.totalPrev,0);assert.equal(data.periodStart.length,24);assert(f.pages()>5);assert.equal(Math.round(data.chart.reduce((n,r)=>n+r.amount,0)*100),1201);
});
test('report database errors fail closed instead of returning partial totals',async()=>{const f=reportFixture(true);assert.equal((await f.route.GET(new NextRequest('http://localhost/api/admin/reports?currency=USD'))).status,503);});
test('all four languages preserve legacy figures and show approved evidence without exposing the internal approver',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const evidence=load('components/site/MetricEvidence.tsx',{'@/lib/public-metrics':metrics});
 const achievements=load('components/site/DestekolAchievements.tsx',{'@/lib/public-metrics':metrics,'./MetricEvidence':evidence});
 for(const locale of ['ar','en','tr','fr']){
  const legacy=renderToStaticMarkup(React.createElement(achievements.default,{data:{items:[{value:'95%',title:'Field support',icon:'heart'}]},locale}));assert(legacy.includes('95%'));assert(!legacy.includes('<details'));
  const html=renderToStaticMarkup(React.createElement(achievements.default,{data:{items:[documented]},locale}));assert(html.includes('95%'));assert(html.includes('2025-01-01'));assert(html.includes('Approved annual report'));assert(html.includes(metrics.metricCopy[locale].actual));assert(!html.includes('Internal approver'));
 }
});
