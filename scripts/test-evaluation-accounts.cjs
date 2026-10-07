const fs=require('fs');const assert=require('node:assert/strict');
(async()=>{
 const {accounts}=JSON.parse(fs.readFileSync('private/evaluation-accounts.json','utf8'));const results=[];
 const matrix={VIEWER:[['/api/admin/campaigns',200],['/api/admin/pages',200],['/api/admin/donations/export',403],['/api/admin/users/export',403],['/api/admin/settings',403],['/api/admin/users',403]],EDITOR:[['/api/admin/pages',200],['/api/admin/posts',200],['/api/admin/donations/export',403],['/api/admin/settings',403]],FINANCE:[['/api/admin/donations/export',200],['/api/admin/users/export',200],['/api/admin/subscribers/export',200],['/api/admin/users?role=DONOR',200],['/api/admin/reports',200],['/api/admin/settings',403],['/api/admin/users',403]],COMPLAINTS:[['/api/admin/donations/export',403],['/api/admin/users/export',403],['/api/admin/settings',403]]};
 for(const a of accounts){
  const login=await fetch('http://localhost:3002/api/admin/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:a.email,password:a.password})});assert.equal(login.status,200,`${a.role} login`);const {token}=await login.json();assert(token);
  const headers={Cookie:`destekol_admin_session=${token}`};
  for(const [path,expected]of matrix[a.role]){const r=await fetch('http://localhost:3002'+path,{headers});await r.arrayBuffer();results.push({role:a.role,path,status:r.status});assert.equal(r.status,expected,`${a.role} ${path}`);}
  for(const path of ['/admin','/admin/messages','/admin/staff']){const r=await fetch('http://localhost:3002'+path,{headers,redirect:'manual'});await r.arrayBuffer();const target=path==='/admin'?({VIEWER:'/admin/pages',EDITOR:'/admin/pages',FINANCE:'/admin/donations',COMPLAINTS:'/admin/messages'})[a.role]:path==='/admin/messages'&&a.role==='COMPLAINTS'?null:'/admin/forbidden';assert.equal(r.status,target?307:200,`${a.role} ${path} page`);if(target)assert.equal(r.headers.get('location'),target);results.push({role:a.role,path,status:r.status,redirect:r.headers.get('location')});}
  const change=await fetch('http://localhost:3002/api/admin/users/'+a.id,{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({role:'ADMIN'})});assert.equal(change.status,403,`${a.role} self escalation`);await change.arrayBuffer();
 }
 fs.writeFileSync('private/evaluation-test-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
})().catch(e=>{console.error(e.message);process.exitCode=1});
