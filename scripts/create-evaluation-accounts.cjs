const fs=require('node:fs');const crypto=require('node:crypto');const bcrypt=require('bcryptjs');const ts=require('typescript');
require('@next/env').loadEnvConfig(process.cwd());
const {createClient}=require('@supabase/supabase-js');
const mod={exports:{}};new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/permissions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(mod,mod.exports);
const presets=mod.exports.PRESET_ROLES;
(async()=>{
 const db=createClient(process.env.SUPABASE_DATABASE_URL||process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{db:{schema:'destekol'},auth:{persistSession:false}});
 const {data:owner,error:oe}=await db.from('User').select('id').eq('role','ADMIN').eq('isStaff',false).single();if(oe)throw Error('Owner lookup failed');
 const expiresAt=new Date(Date.now()+7*86400000).toISOString();const suffix=crypto.randomBytes(3).toString('hex');
 const accounts=[];for(const [key,role,preset] of [['viewer','VIEWER','viewer'],['editor','EDITOR','editor'],['finance','FINANCE','finance_manager'],['complaints','COMPLAINTS','complaints_officer']]){
  const password=crypto.randomBytes(24).toString('base64url');accounts.push({id:crypto.randomUUID(),email:`evaluation.${key}.${suffix}@destekol.test`,name:`Evaluation — ${presets[preset].label}`,role,preset,password,permissions:presets[preset].permissions,passwordHash:await bcrypt.hash(password,12)});
 }
 fs.mkdirSync('private',{recursive:true});
 const file={expiresAt,accounts:accounts.map(({passwordHash,...a})=>a)};fs.writeFileSync('private/evaluation-accounts.json',JSON.stringify(file,null,2));
 fs.writeFileSync('private/evaluation-accounts.md',`# حسابات تقييم صلاحيات Destekol\n\nرابط الدخول: http://localhost:3002/admin/login\n\nتنتهي صلاحية هذه الحسابات في ${expiresAt}. حساب المدير الأصلي لم يتغير.\n\n| الدور | البريد | كلمة المرور |\n|---|---|---|\n`+accounts.map(a=>`| ${presets[a.preset].label} | ${a.email} | ${a.password} |`).join('\n')+'\n\nجرّب كل حساب في نافذة خاصة منفصلة. يمكن للمدير إلغاء الوصول من Staff & Permissions باختيار Revoke Staff Access. هذا الملف خاص ومحلي ولا يُرفع إلى Git.\n');
 const rows=accounts.map(({password,preset,...a})=>({...a,isStaff:true,emailVerified:true,isEvaluation:true,accessExpiresAt:expiresAt}));
 const {error}=await db.from('User').insert(rows);if(error)throw Error('Evaluation account creation failed: '+error.code);
 const {error:ae}=await db.from('AdminAuditLog').insert(accounts.map(a=>({actorId:owner.id,action:'staff.evaluation.create',outcome:'SUCCESS',resourceId:a.id,site:'destekol'})));
 if(ae){await db.from('User').update({isStaff:false,permissions:[]}).in('id',accounts.map(a=>a.id));throw Error('Audit failed; evaluation access disabled');}
 console.log('Created four temporary evaluation accounts; passwords saved only in ignored private files.');
})().catch(()=>{console.error('Account setup failed; inspect locally without printing credentials.');process.exitCode=1});
