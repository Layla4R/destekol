const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),{test}=require('node:test'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(file,mocks={}){const m={exports:{}};const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;new Function('require','module','exports',js)(key=>key in mocks?mocks[key]:require(key),m,m.exports);return m.exports;}
const model=load('lib/campaign-plan.ts'),copy=load('lib/campaign-plan-copy.ts'),gallery=load('lib/campaign-gallery.ts');
const Detail=load('components/site/CampaignPlanDetails.tsx',{'@/lib/campaign-plan':model,'@/lib/campaign-plan-copy':copy,'@/lib/format':{formatCurrency:(n,c)=>`${n} ${c}`}}).default;
function fixture(){const p=model.emptyCampaignPlan();Object.assign(p,{version:'fixture-v1',state:'PRELAUNCH',targetBeneficiaries:100,implementationStart:'2027-01-01',implementationEnd:'2027-02-01',reportDate:'2027-03-01',internalReference:'PRIVATE-REFERENCE',needSourceUrl:'https://example.test/evidence',budget:[{labels:{ar:'بند الاختبار',tr:'Test kalemi',en:'Test item',fr:'Poste de test'},quantity:100,unitCost:100}]});for(const l of model.PLAN_LOCALES)for(const [key]of model.PLAN_FIELDS)p.texts[l][key]=`${l} fixture ${key}`;return p;}
test('approval requires a costed, dated and complete four-language plan and medical review',()=>{
 const p=fixture();assert.deepEqual(model.campaignPlanErrors(p,10000,'medical'),[]);
 for(const change of [{budget:[]},{reportDate:'2026-01-01'},{implementationStart:'2027-02-30'},{targetBeneficiaries:0},{internalReference:''},{version:''},{state:'UNSPECIFIED'}])assert.throws(()=>model.prepareCampaignPlan({...p,...change,approved:true},10000,'medical','fixture-actor'));
 assert.throws(()=>model.prepareCampaignPlan({...p,approved:true},9999,'medical','fixture-actor'));
 const missing=fixture();missing.texts.fr.healthReview='';assert.throws(()=>model.prepareCampaignPlan({...missing,approved:true},10000,'medical','fixture-actor'));assert.equal(model.campaignPlanErrors(missing,10000,'water').length,0);
 const approved=model.prepareCampaignPlan({...p,approved:true,approvedBy:'forged',approvedAt:'old'},10000,'medical','fixture-actor');assert.equal(approved.approvedBy,'fixture-actor');assert(!Number.isNaN(Date.parse(approved.approvedAt)));
 const draft=model.prepareCampaignPlan({...approved,approved:false},10000,'medical','fixture-actor');assert.equal(draft.approvedAt,'');assert.equal(draft.approvedBy,'');
});
test('public plans show only approved valid data, correct currency and no internal approval identity',()=>{
 const approved=model.prepareCampaignPlan({...fixture(),approved:true},10000,'medical','PRIVATE-ACTOR');
 for(const locale of model.PLAN_LOCALES){const render=plan=>renderToStaticMarkup(React.createElement(Detail,{plan,locale,goal:10000,currency:'EUR',category:'medical'}));const html=render(approved);assert(html.includes(approved.texts[locale].needEvidence));assert(html.includes('10000 EUR'));assert(html.includes(copy.getCampaignPlanCopy(locale).target));assert(!html.includes('PRIVATE-ACTOR'));assert(!html.includes('PRIVATE-REFERENCE'));assert(render({...approved,approved:false}).includes(copy.getCampaignPlanCopy(locale).pending));assert(!render({...approved,budget:[]}).includes('fixture overview'));}
 const unsafe=fixture();unsafe.needSourceUrl='javascript:alert(1)';assert.equal(model.readCampaignPlan(unsafe).needSourceUrl,'');
});
test('admin PATCH rejects approval before writing and editing withdraws existing approval',async()=>{
 let writes=[];const current={goalAmount:10000,category:'medical',projectPlan:model.prepareCampaignPlan({...fixture(),approved:true},10000,'medical','fixture-actor')};
 const builder={select(){return this},eq(){return this},update(v){writes.push(v);return this},maybeSingle:async()=>({data:current,error:null}),single:async()=>({data:{id:'fixture'},error:null})};
 const route=load('app/api/admin/campaigns/[id]/route.ts',{'@/lib/admin-access':{requireRoutePermission:async()=>({id:'fixture-actor'}),accessErrorResponse:()=>new Response('',{status:403})},'@/lib/supabase':{getSupabase:()=>({from:()=>builder})},'@/lib/campaign-plan':model,'@/lib/campaign-gallery':gallery,'next/cache':{revalidatePath(){}}});
 const req=body=>new Request('http://localhost/api/admin/campaigns/fixture',{method:'PATCH',body:JSON.stringify(body)});
 assert.equal((await route.PATCH(req({projectPlan:{approved:true}}),{params:{id:'fixture'}})).status,400);assert.equal(writes.length,0);
 assert.equal((await route.PATCH(req({gallery:['javascript:alert(1)']}),{params:{id:'fixture'}})).status,400);assert.equal(writes.length,0);
 assert.equal((await route.PATCH(req({gallery:['/images/test.jpg','https://example.test/test.jpg','/images/test.jpg']}),{params:{id:'fixture'}})).status,200);assert.deepEqual(writes.at(-1).gallery,['/images/test.jpg','https://example.test/test.jpg']);
 assert.equal((await route.PATCH(req({goalAmount:20000}),{params:{id:'fixture'}})).status,200);assert.equal(writes.at(-1).projectPlan.approved,false);
 assert.equal((await route.PATCH(req({projectPlan:{...fixture(),approved:true}}),{params:{id:'fixture'}})).status,200);assert.equal(writes.at(-1).projectPlan.approvedBy,'fixture-actor');
});
