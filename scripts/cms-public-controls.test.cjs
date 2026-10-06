const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
function load(name){const exports={};new Function('exports',ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(exports);return exports;}
const {donationOptions}=load('donation-options'),{storyLink}=load('story-link'),{planTranslation}=load('translation-content');

test('donation controls follow configured amounts and never invent fallback presets',()=>{
 assert.deepEqual(donationOptions(),{amounts:[],defaultAmount:0});
 assert.deepEqual(donationOptions({amounts:[{value:17},{value:83},17,0,-1,'invalid',Infinity],defaultAmount:42}),{amounts:[17,83],defaultAmount:42});
 assert.deepEqual(donationOptions({amounts:[{value:17}],defaultAmount:-2}),{amounts:[17],defaultAmount:17});
});
test('internal campaign destinations preserve the chosen language, query and fragment',()=>{
 for(const locale of ['ar','en','fr','tr']){
  assert.equal(storyLink('/ar/campaigns/clean-water?amount=83#donate',locale),`/${locale}/campaigns/clean-water?amount=83#donate`);
  assert.equal(storyLink('https://destekol.org/ar/donate?story=a',locale),`https://destekol.org/${locale}/donate?story=a`);
 }
 assert.equal(storyLink('https://example.org/ar/resource','fr'),'https://example.org/ar/resource');
 assert.equal(storyLink('javascript:alert(1)','en'),null);assert.equal(storyLink('//example.org','en'),null);
});
test('admin translation includes story labels and messages while preserving media and numeric data',()=>{
 const source=[{id:'story',type:'stories',props:{storyEyebrow:'كن إلى جانب إنسان',readButtonText:'اقرأ القصة',successText:'شكراً',items:[{id:'one',location:'نيجيريا',status:'قيد التنفيذ',value:15,image:'/photo.png',buttonLink:'/ar/donate'}]}}];
 const plan=planTranslation(source);assert.equal(plan.texts.length,5);const result=plan.apply(plan.texts.map((_,i)=>'Translated '+i));
 assert.equal(result[0].props.storyEyebrow,'Translated 0');assert.equal(result[0].props.items[0].value,15);assert.equal(result[0].props.items[0].image,'/photo.png');assert.equal(result[0].props.items[0].buttonLink,'/ar/donate');
});
