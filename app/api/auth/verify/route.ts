import {db} from "@/lib/db";import {digest} from "@/lib/auth-guard";
export const runtime="nodejs";
export async function GET(request:Request){
 const token=new URL(request.url).searchParams.get("token");
 if(!token||!/^[a-f0-9]{64}$/.test(token))return new Response("Lien invalide",{status:400});
 const client=await db.connect();
 try{
  await client.query("BEGIN");
  const r=await client.query("UPDATE account_tokens SET used_at=now() WHERE token_hash=$1 AND kind='verify' AND used_at IS NULL AND expires_at>now() RETURNING user_id",[digest(token)]);
  if(!r.rows.length){await client.query("ROLLBACK");return new Response("Lien expiré ou déjà utilisé",{status:400})}
  await client.query("UPDATE users SET email_verified_at=now() WHERE id=$1",[r.rows[0].user_id]);
  await client.query("COMMIT");
  return Response.redirect(new URL("/compte/?verified=1",request.url));
 }catch{await client.query("ROLLBACK");return new Response("Vérification indisponible",{status:503})}
 finally{client.release()}
}
