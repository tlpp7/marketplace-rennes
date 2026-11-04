import {db} from "@/lib/db";import {publicOrigin} from "@/lib/public-origin";import {body,fail,hashPassword,stringField,trustedRequest,setSession} from "@/lib/security";
import {recordFailure,throttled,createToken} from "@/lib/auth-guard";
import {getServerConfig} from "@/lib/config/env";import {sendAccountEmail} from "@/lib/mail";
export const runtime="nodejs";
export async function POST(request:Request){try{
 if(!getServerConfig().flags.accountsEnabled)return fail("Inscriptions non ouvertes",503);
 if(!await trustedRequest(request))return fail("Origine non autorisée",403);
 const d=await body(request),handle=stringField(d.handle,40).toLowerCase(),email=stringField(d.email,254).toLowerCase(),password=d.password;
 if(!/^[a-z0-9_-]{3,40}$/.test(handle)||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=="string"||password.length<12||password.length>128)return fail("Identifiants invalides");
 const rateKey="register:"+email;if(await throttled(rateKey))return fail("Réessaie plus tard",429);await recordFailure(rateKey);
 const config=getServerConfig();
 const local=!config.production&&config.flags.allowUnverifiedLocal;
 if(!local&&!config.mail.configured)return fail("Confirmation email non configurée",503);
 const client=await db.connect();let userId:string;
 try{await client.query("BEGIN");const r=await client.query<{id:string}>("INSERT INTO users(handle,email,password_hash) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id",[handle,email,hashPassword(password)]);if(!r.rows.length){await client.query("ROLLBACK");return fail("Compte déjà existant",409)}userId=r.rows[0].id;await client.query("INSERT INTO member_profiles(user_id) VALUES($1)",[userId]);if(local)await client.query("UPDATE users SET email_verified_at=now() WHERE id=$1",[userId]);await client.query("COMMIT")}catch(e){await client.query("ROLLBACK");throw e}finally{client.release()}
 if(local){await setSession(userId);return Response.json({ok:true})}
 const token=await createToken(userId,"verify");await sendAccountEmail(email,"Confirme ton adresse email",new URL("/api/auth/verify?token="+token,publicOrigin(request)).toString());
 return Response.json({ok:true,verificationRequired:true});
 }catch{return fail("Inscription indisponible",503)}}
