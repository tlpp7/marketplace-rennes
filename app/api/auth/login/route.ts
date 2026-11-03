import {sql} from "@/lib/db";import {body,checkPassword,fail,setSession,stringField,trustedRequest} from "@/lib/security";import {clearFailures,recordFailure,throttled} from "@/lib/auth-guard";
export const runtime="nodejs";
export async function POST(request:Request){try{
 if(!await trustedRequest(request))return fail("Origine non autorisée",403);
 const d=await body(request),email=stringField(d.email,254).toLowerCase(),password=d.password;
 if(!email||typeof password!=="string")return fail("Identifiants invalides",400);
 const key="login:"+email;if(await throttled(key))return fail("Trop de tentatives, réessaie plus tard",429);
 const rows=await sql<{id:string;password_hash:string;email_verified_at:string|null}>("SELECT id,password_hash,email_verified_at FROM users WHERE email=$1 AND disabled=false",[email]);
 if(!rows[0]||!checkPassword(password,rows[0].password_hash)){await recordFailure(key);return fail("Identifiants invalides",401)}
 if(!rows[0].email_verified_at)return fail("Confirme ton email avant de te connecter",403);
 await clearFailures(key);await setSession(rows[0].id);return Response.json({ok:true});
 }catch{return fail("Connexion indisponible",503)}}
