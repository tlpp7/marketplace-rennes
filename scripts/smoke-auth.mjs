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
 // Test a genuine third-party session, not merely an invalid cookie.
 const outsider=await post("/api/auth/register/",{handle:"tiers_"+nonce,email:"tiers_"+nonce+"@example.invalid",password:"TestPassword_123456"});
 const forbidden=await get("/api/messages/?conversationId="+conversation.result.conversationId,outsider.cookie);
 if(forbidden.status!==200||forbidden.data.messages.length!==0)throw Error("Nonparticipant read not isolated");
 // Test appointment creation and provider approval/decline.
 const provider=await post("/api/auth/register/",{handle:"couture_"+nonce,email:"couture_"+nonce+"@example.invalid",password:"TestPassword_123456"});
 const providerMe=await get("/api/me/",provider.cookie);
 await client.query("UPDATE member_profiles SET kind='care',approved=true WHERE user_id=$1",[providerMe.data.user.id]);
 const appointment=await post("/api/appointments/",{providerHandle:"couture_"+nonce,startsAt:new Date(Date.now()+172800000).toISOString(),note:"Test de retouche"},b.cookie);
 const appointmentId=appointment.result.request.id;
 const response=await fetch(origin+"/api/appointments/"+appointmentId+"/",{method:"PATCH",headers:{"Content-Type":"application/json",Origin:origin,Cookie:provider.cookie},body:JSON.stringify({action:"accept"})});
 if(!response.ok)throw Error("Provider cannot accept appointment");
 const appointments=await get("/api/appointments/",b.cookie);
 if(!appointments.data.appointments.some(x=>x.id===appointmentId&&x.status==="accepted"))throw Error("Appointment transition failed");
 // Reviews must be refused without a verified transaction.
 const review=await fetch(origin+"/api/reviews/",{method:"POST",headers:{"Content-Type":"application/json",Origin:origin,Cookie:b.cookie},body:JSON.stringify({interactionId:"00000000-0000-4000-8000-000000000001",rating:5,text:"Le produit est conforme à la description"})});
 if(review.status!==403)throw Error("Unverified review accepted");
 // Check follow removal.
 const unfollow=await fetch(origin+"/api/follows/",{method:"DELETE",headers:{"Content-Type":"application/json",Origin:origin,Cookie:b.cookie},body:JSON.stringify({handle:"vendeur_"+nonce})});
 if(!unfollow.ok)throw Error("Unfollow failed");
 const afterFollow=await get("/api/follows/",b.cookie);
 if(afterFollow.data.follows.length)throw Error("Follow not removed");
 const forbiddenAnonymous=await get("/api/messages/?conversationId="+conversation.result.conversationId,"rf_session=invalid");
 if(forbiddenAnonymous.status!==401)throw Error("Unauthorized anonymous read allowed");
 const blockedAdmin=await get("/api/admin/profiles/",b.cookie);
 if(blockedAdmin.status!==403)throw Error("Ordinary member accessed admin profiles");
 const crossAppointment=await fetch(origin+"/api/appointments/"+appointmentId+"/",{method:"PATCH",headers:{"Content-Type":"application/json",Origin:origin,Cookie:outsider.cookie},body:JSON.stringify({action:"decline"})});
 if(crossAppointment.status!==409)throw Error("Outsider changed an appointment");
 const foreignOrigin=await fetch(origin+"/api/messages/",{method:"POST",headers:{"Content-Type":"application/json",Origin:"https://attacker.example",Cookie:b.cookie},body:JSON.stringify({conversationId:conversation.result.conversationId,message:"cross-site request"})});
 if(foreignOrigin.status!==403)throw Error("Foreign-origin message accepted");
 console.log("V0.3 PASS: accounts, follows, messages, CSRF, appointments, admin denial and review checks");
}finally{
 await client.query("DELETE FROM users WHERE email LIKE $1",["%"+nonce+"@example.invalid"]).catch(()=>{});
 await client.end();
}
