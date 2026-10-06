const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const {SignJWT,jwtVerify}=require('jose');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'lib/session-secret.ts'),'utf8');
function load(env){const exports={};new Function('exports','process',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports,{env});return exports.getSessionSecret;}
test('missing, blank, short, known fallback and public keys are refused in all environments',()=>{
 for(const NODE_ENV of ['development','production','test'])for(const secret of [undefined,'',' '.repeat(40),'short','dev-secret-change-me','fallback-secret-key-32-chars-long','public-anon-key-that-is-more-than-32-bytes']){
 const get=load({NODE_ENV,SUPABASE_JWT_SECRET:secret,NEXT_PUBLIC_SUPABASE_ANON_KEY:'public-anon-key-that-is-more-than-32-bytes'});
 assert.throws(get,/AUTH_CONFIGURATION_ERROR/);
 }
 assert.throws(load({SUPABASE_JWT_SECRET:'server-anon-key-that-is-more-than-32-bytes',SUPABASE_ANON_KEY:'server-anon-key-that-is-more-than-32-bytes'}),/AUTH_CONFIGURATION_ERROR/);
});
test('valid private key signs and verifies; old fallback-signed tokens are rejected',async()=>{
 const get=load({SUPABASE_JWT_SECRET:'test-only-private-key-0123456789-abcdef'});
 const token=await new SignJWT({role:'ADMIN'}).setProtectedHeader({alg:'HS256'}).setExpirationTime('1h').sign(get());
 assert.equal((await jwtVerify(token,get(),{algorithms:['HS256']})).payload.role,'ADMIN');
 const forged=await new SignJWT({role:'ADMIN'}).setProtectedHeader({alg:'HS256'}).sign(new TextEncoder().encode('dev-secret-change-me'));
 await assert.rejects(jwtVerify(forged,get(),{algorithms:['HS256']}));
});
test('all session consumers use the shared private key without local fallback',()=>{
 for(const file of ['lib/auth.ts','lib/donorAuth.ts','middleware.ts']){
 const text=fs.readFileSync(path.join(root,file),'utf8');
 assert.match(text,/getSessionSecret\(\)/);
 assert.doesNotMatch(text,/dev-secret-change-me|fallback-secret-key|NEXT_PUBLIC_SUPABASE_ANON_KEY/);
 assert.match(text,/jwtVerify\(token, getSessionSecret\(\), \{ algorithms: \["HS256"\] \}\)/);
 }
});
