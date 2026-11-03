import pg from "pg";
const origin="http://127.0.0.1:3000";
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
const nonce=Date.now().toString(36);
async function post(path,payload,cookie){
 const r=await fetch(origin+path,{method:"POST",headers:{"Content-Type":"application/json",Origin:origin,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(payload)});
 const result=await r.json();if(!r.ok)throw Error(path+": "+JSON.stringify(result));return {result,cookie:r.headers.get("set-cookie")?.split(";")[0]};
}
async function get(path,cookie){const r=await fetch(origin+path,{headers:cookie?{Cookie:cookie}:{}});const data=await r.json();return {status:r.status,data}}
try{
 await client.connect();
 const a=await post("/api/auth/register/",{handle:"vendeur_"+nonce,email:"vendeur_"+nonce+"@example.invalid",password:"TestPassword_123456"});
 const b=await post("/api/auth/register/",{handle:"acheteur_"+nonce,email:"acheteur_"+nonce+"@example.invalid",password:"TestPassword_123456"});
 if(!a.cookie||!b.cookie)throw Error("Session cookies missing");
 let me=await get("/api/me/",a.cookie);if(me.status!==200)throw Error("Account session failed");
 const sellerId=me.data.user.id;
 await client.query("UPDATE member_profiles SET kind='reseller',approved=true WHERE user_id=$1",[sellerId]);
 await post("/api/follows/",{handle:"vendeur_"+nonce},b.cookie);
 const followed=await get("/api/follows/",b.cookie);if(followed.data.follows.length!==1)throw Error("Following failed");
 const conversation=await post("/api/conversations/",{handle:"vendeur_"+nonce},b.cookie);
 await post("/api/messages/",{conversationId:conversation.result.conversationId,message:"Bonjour, cette pièce est-elle disponible ?"},b.cookie);
 const received=await get("/api/messages/?conversationId="+conversation.result.conversationId,a.cookie);
 if(received.data.messages.length!==1)throw Error("Messaging failed");
 const forbidden=await get("/api/messages/?conversationId="+conversation.result.conversationId,"rf_session=invalid");
 if(forbidden.status!==401)throw Error("Unauthorized read allowed");
 console.log("V0.3 PASS: registration, session, follow, conversation, message isolation");
}finally{
 await client.query("DELETE FROM users WHERE email LIKE $1",["%"+nonce+"@example.invalid"]).catch(()=>{});
 await client.end();
}
