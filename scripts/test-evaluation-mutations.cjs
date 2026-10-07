const fs=require('fs');const assert=require('node:assert/strict');const crypto=require('node:crypto');const {SignJWT}=require('jose');const {createClient}=require('@supabase/supabase-js');require('@next/env').loadEnvConfig(process.cwd());
(async()=>{
 const {accounts}=JSON.parse(fs.readFileSync('private/evaluation-accounts.json','utf8'));
 const db=createClient(process.env.SUPABASE_DATABASE_URL||process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{db:{schema:'destekol'},auth:{persistSession:false}});
 async function cookie(a){const token=await new SignJWT({email:a.email,role:a.role,site:'destekol'}).setProtectedHeader({alg:'HS256'}).setExpirationTime('1h').sign(new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET));return {Cookie:`destekol_admin_session=${token}`,'Content-Type':'application/json'};}
 const id=crypto.randomUUID();const marker='Evaluation fixture '+id;const {error}=await db.from('ContactMessage').insert({id,name:'Evaluation Fixture',email:'fixture@destekol.test',subject:marker,message:marker,isSensitive:true,isRead:false});assert(!error,'Fixture setup');
 const finance=accounts.find(a=>a.role==='FINANCE'),viewer=accounts.find(a=>a.role==='VIEWER');
 try{
  for(const a of accounts){const r=await fetch('http://localhost:3002/api/admin/messages/'+id,{method:'PATCH',headers:await cookie(a),body:JSON.stringify({isRead:true})});await r.arrayBuffer();assert.equal(r.status,a.role==='COMPLAINTS'?200:403,`${a.role} complaint update`);}
  const r=await fetch('http://localhost:3002/api/admin/messages/'+id,{method:'DELETE',headers:await cookie(accounts.find(a=>a.role==='COMPLAINTS'))});await r.arrayBuffer();assert.equal(r.status,403,'Complaint deletion denied');
  const {data:updated}=await db.from('ContactMessage').select('isRead').eq('id',id).single();assert.equal(updated.isRead,true);
  const {data:events}=await db.from('AdminAuditLog').select('action,outcome').eq('resourceId',id);assert(events.some(e=>e.action==='messages.edit'&&e.outcome==='SUCCESS'));
  const h=await cookie(finance);assert(!(await db.from('User').update({permissions:finance.permissions.filter(p=>p!=='donations.export')}).eq('id',finance.id).eq('isEvaluation',true)).error);
  const denied=await fetch('http://localhost:3002/api/admin/donations/export',{headers:h});await denied.arrayBuffer();assert.equal(denied.status,403,'Permission removal on existing token');
  assert(!(await db.from('User').update({accessExpiresAt:'2000-01-01T00:00:00Z'}).eq('id',viewer.id).eq('isEvaluation',true)).error);
  const expired=await fetch('http://localhost:3002/api/admin/campaigns',{headers:await cookie(viewer)});await expired.arrayBuffer();assert.equal(expired.status,401,'Expired evaluation token');
  const {data:owner}=await db.from('User').select('email,role').eq('role','ADMIN').eq('isStaff',false).single();const list=await fetch('http://localhost:3002/api/admin/users',{headers:await cookie(owner)});assert.equal(list.status,200,'Owner staff list');const {users}=await list.json();assert(accounts.every(a=>users.some(u=>u.id===a.id&&u.role===a.role&&u.isEvaluation)));
  console.log('Passed: 4 role mutation checks; specialist read-status update and audit; deletion denial; immediate permission revocation; expired account denial; owner sees all evaluation roles.');
 }finally{
  const restored=await db.from('User').update({permissions:finance.permissions}).eq('id',finance.id).eq('isEvaluation',true);assert(!restored.error,'Restore finance permissions');
  const expiresAt=JSON.parse(fs.readFileSync('private/evaluation-accounts.json','utf8')).expiresAt;assert(!(await db.from('User').update({accessExpiresAt:expiresAt}).eq('id',viewer.id).eq('isEvaluation',true)).error,'Restore evaluation expiry');
  assert(!(await db.from('ContactMessage').delete().eq('id',id).eq('subject',marker)).error,'Clean fixture');
 }
})().catch(e=>{console.error(e.message);process.exitCode=1});
