const fs=require('node:fs'),path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict'),ts=require('typescript');
function route(error=null,authorized=true){
 const calls=[];const exports={};const deps={
  '@/lib/auth':{requireAdmin:async()=>{if(!authorized)throw Error('Unauthorized');}},
  '@/lib/i18n':{clearTranslationCache(){}},
  '@/lib/supabase':{getSupabase:()=>({from:()=>({upsert:async(row,options)=>{calls.push({...row,conflict:options.onConflict});return {error};}})})},
  'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status||200})}},
 };
 new Function('require','exports',ts.transpileModule(fs.readFileSync(path.join(__dirname,'../app/api/admin/translations/route.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(name=>deps[name],exports);
 return {calls,patch:body=>exports.PATCH({json:async()=>body})};
}
test('admin label saves supply the required namespace and surface database errors',async()=>{
 const good=route();assert.equal((await good.patch({locale:'tr',key:'site.name',value:'Dernek'})).status,200);assert.equal(good.calls[0].namespace,'site');assert.equal(good.calls[0].conflict,'locale,namespace,key');
 const failed=route({message:'Save failed'});const response=await failed.patch({locale:'en',key:'footer.quick_links',value:'Links'});assert.equal(response.status,500);assert.equal(response.body.error,'Save failed');
});
test('batch saves count database failures instead of reporting false success',async()=>{
 const api=route({message:'Save failed'});const response=await api.patch({batch:[{locale:'fr',key:'footer.quick_links',value:'Liens'}]});assert.equal(response.status,500);assert.equal(response.body.failed,1);assert.equal(api.calls[0].namespace,'footer');
});
test('unauthorized and unsupported-language changes cannot write CMS labels',async()=>{
 const locked=route(null,false);assert.equal((await locked.patch({locale:'en',key:'x',value:'x'})).status,401);assert.equal(locked.calls.length,0);
 const invalid=route();assert.equal((await invalid.patch({locale:'es',key:'x',value:'x'})).status,400);assert.equal(invalid.calls.length,0);
});
