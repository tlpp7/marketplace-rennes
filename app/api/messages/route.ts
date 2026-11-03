import {sql} from "@/lib/db";
import {body,currentUser,fail,stringField,trustedRequest} from "@/lib/security";

export const runtime="nodejs";

const conversationIdPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request:Request){
 const u=await currentUser();
 if(!u)return fail("Connexion requise",401);
 const id=new URL(request.url).searchParams.get("conversationId");
 if(!id||!conversationIdPattern.test(id))return fail("Conversation invalide",400);

 // Return the same response for missing and inaccessible conversations.
 // Check membership independently so an empty authorized conversation stays readable.
 const membership=await sql<{allowed:boolean}>(
  "SELECT EXISTS(SELECT 1 FROM participants WHERE conversation_id=$1 AND user_id=$2) AS allowed",
  [id,u.id]
 );
 if(!membership[0]?.allowed)return fail("Conversation introuvable",404);

 const rows=await sql(
  "SELECT m.id,m.body,m.created_at,u.handle AS sender FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.conversation_id=$1 ORDER BY m.created_at DESC LIMIT 100",
  [id]
 );
 return Response.json({messages:rows.reverse()});
}

export async function POST(request:Request){
 if(!await trustedRequest(request))return fail("Origine non autorisée",403);
 const u=await currentUser();
 if(!u)return fail("Connexion requise",401);
 const d=await body(request),id=stringField(d.conversationId,64),message=stringField(d.message,2000);
 if(!conversationIdPattern.test(id)||message.length<1)return fail("Message invalide");
 const r=await sql(
  "INSERT INTO messages(conversation_id,sender_id,body) SELECT $1,$2,$3 WHERE EXISTS(SELECT 1 FROM participants WHERE conversation_id=$1 AND user_id=$2) RETURNING id",
  [id,u.id,message]
 );
 return r.length?Response.json({ok:true}):fail("Accès refusé",403);
}
