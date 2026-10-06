const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const out={};new Function('exports',ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/cms-localization.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(out);
const original=()=>[{id:'impact',type:'destekol_achievements',props:{title:'الإنجازات',items:[{icon:'projects',title:'المشاريع',value:'+15'},{icon:'users',title:'المستفيدون',value:'+300'}]}}];
const translation=()=>[{id:'impact',type:'destekol_achievements',props:{title:'Achievements',items:[{icon:'users',title:'People',value:'30'},{icon:'projects',title:'Projects',value:'+4'}]}},{id:'removed',type:'stats',props:{items:[{value:'fake'}]}}];
test('fresh admin values and block order win over stale translations; localized titles remain',()=>{
 const base=original(),localized=translation();const result=out.mergeCmsTranslation(base,localized);
 assert.equal(result.length,1);assert.equal(result[0].props.title,'Achievements');
 assert.deepEqual(result[0].props.items.map(i=>i.value),['+15','+300']);assert.deepEqual(result[0].props.items.map(i=>i.title),['Projects','People']);
 assert.equal(base[0].props.title,'الإنجازات');assert.equal(localized[0].props.items[0].value,'30');
 assert.deepEqual(out.mergeCmsTranslation([],localized),[]);
});
test('text-only translation saves cannot restore stale counts; deliberate number edits update the canonical data',()=>{
 const previous=translation();const submitted=structuredClone(previous);submitted[0].props.title='New heading';
 assert.deepEqual(out.applyCmsSharedEdits(original(),previous,submitted),original());
 submitted[0].props.items.find(i=>i.icon==='projects').value='+50';
 const result=out.applyCmsSharedEdits(original(),previous,submitted);
 assert.equal(result[0].props.items[0].value,'+50');assert.equal(result[0].props.title,'الإنجازات');
});
test('media, links and numeric settings come from the source page, not translated snapshots',()=>{
 const base={id:'hero',type:'hero',props:{image:'/current.jpg',buttonLink:'/current',amounts:[{value:75}],title:'مصدر'}};
 const result=out.mergeCmsTranslation(base,{...base,props:{image:'/old.jpg',buttonLink:'/old',amounts:[{value:10}],title:'Localized'}});
 assert.equal(result.props.image,'/current.jpg');assert.equal(result.props.buttonLink,'/current');assert.equal(result.props.amounts[0].value,75);assert.equal(result.props.title,'Localized');
});
