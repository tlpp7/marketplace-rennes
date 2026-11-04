import {SMTPServer} from "smtp-server";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import pg from "pg";
const origin="http://127.0.0.1:3001";
const nonce=Date.now().toString(36);
const email="smtp_"+nonce+"@example.invalid";
const handle="smtp_"+nonce;
const messages=[];
const smtp=new SMTPServer({secure:false,authOptional:true,allowInsecureAuth:true,disabledCommands:["STARTTLS"],onAuth(auth,session,cb){cb(null,{user:"test"})},onData(stream,session,cb){let s="";stream.on("data",v=>s+=v);stream.on("end",()=>{messages.push(s);cb()})}});
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
let child;
let childLog="";
function check(condition,reason){if(!condition)throw Error(reason)}
async function request(path,data,cookie){
 const r=await fetch(origin+path,{method:"POST",headers:{"Content-Type":"application/json",Origin:origin,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(data)});
 const json=await r.json().catch(()=>({}));return {status:r.status,json,cookie:r.headers.get("set-cookie")?.split(";")[0]};
}
function tokenFromMessage(i){const source=(messages[i]??"").replace(/=\r?\n/g,"").replace(/=3D/gi,"=");const found=source.match(/[?&]token=([a-f0-9]{64})/);if(!found)throw Error("Aucun jeton trouvé dans le message SMTP (réception="+messages.length+")");return found[1]}
try{
 await new Promise((resolve,reject)=>smtp.listen(2525,"127.0.0.1",e=>e?reject(e):resolve()));
 await client.connect();
 child=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port","3001"],{env:{...process.env,NODE_ENV:"production",APP_ORIGIN:"https://127.0.0.1:3001",SMTP_HOST:"127.0.0.1",SMTP_PORT:"2525",SMTP_SECURE:"false",SMTP_USER:"test",SMTP_PASSWORD:"test",SMTP_FROM:"RennFripes <test@example.invalid>",ACCOUNTS_ENABLED:"true",ALLOW_UNVERIFIED_LOCAL:"false"},stdio:["ignore","pipe","pipe"]});
 child.stdout.on("data",v=>{childLog=(childLog+v.toString()).slice(-4000)});
 child.stderr.on("data",v=>{childLog=(childLog+v.toString()).slice(-4000)});
 let ready=false;for(let i=0;i<70;i++){try{const r=await fetch(origin+"/api/health/");if(r.ok){ready=true;break}}catch{}await delay(1000)}
 check(ready,"Le serveur Next.js du test SMTP ne démarre pas : "+childLog.slice(-1800));
 const registered=await request("/api/auth/register/",{handle,email,password:"MyLongPassword_9876"});
 check(registered.status===200&&registered.json.verificationRequired===true,"L'inscription vérifiée a échoué: "+JSON.stringify(registered));
 check(messages.length===1,"Email de vérification non reçu par SMTP local");
 const loginBefore=await request("/api/auth/login/",{email,password:"MyLongPassword_9876"});
 check(loginBefore.status===403,"Connexion avant validation email autorisée");
 const verifyToken=tokenFromMessage(0);
 const verify=await fetch(origin+"/api/auth/verify/?token="+verifyToken,{redirect:"manual"});
 check(verify.status>=300&&verify.status<400,"Vérification email échouée: "+verify.status);
 const replay=await fetch(origin+"/api/auth/verify/?token="+verifyToken,{redirect:"manual"});
 check(replay.status===400,"Un jeton email peut être réutilisé");
 const logged=await request("/api/auth/login/",{email,password:"MyLongPassword_9876"});
 check(logged.status===200&&logged.cookie,"Connexion après vérification refusée");
 const reset=await request("/api/auth/reset-request/",{email});
 check(reset.status===200&&messages.length===2,"Demande de récupération ou email SMTP invalide");
 const token=tokenFromMessage(1);
 const resetResult=await request("/api/auth/reset/",{token,password:"UpdatedPassword_123456"});
 check(resetResult.status===200,"Mot de passe non modifié");
 const resetReplay=await request("/api/auth/reset/",{token,password:"UpdatedPassword_123456"});
 check(resetReplay.status===400,"Jeton réinitialisation réutilisable");
 const oldSession=await fetch(origin+"/api/me/",{headers:{Cookie:logged.cookie}});
 check(oldSession.status===401,"Ancienne session encore utilisable");
 const oldPassword=await request("/api/auth/login/",{email,password:"MyLongPassword_9876"});
 check(oldPassword.status===401,"Ancien mot de passe encore valide");
 const newPassword=await request("/api/auth/login/",{email,password:"UpdatedPassword_123456"});
 check(newPassword.status===200,"Connexion avec nouveau mot de passe impossible");
 const csrf=await fetch(origin+"/api/auth/logout/",{method:"POST",headers:{Origin:"https://untrusted.example",Cookie:newPassword.cookie}});
 check(csrf.status===403,"Requête d'origine étrangère acceptée");
 console.log("SMTP PASS: inscription, email, jeton unique, connexion vérifiée, récupération, invalidation des sessions, CSRF");
}finally{
 if(child){child.kill("SIGTERM");await delay(1200)}
 await client.query("DELETE FROM account_tokens WHERE user_id IN (SELECT id FROM users WHERE email=$1)",[email]).catch(()=>{});
 await client.query("DELETE FROM users WHERE email=$1",[email]).catch(()=>{});
 await client.end().catch(()=>{});
 await new Promise(resolve=>smtp.close(()=>resolve())).catch(()=>{});
}
