import {sql} from "@/lib/db";
export const runtime="nodejs";
export const dynamic="force-dynamic";

// Readiness: Railway must not route traffic before PostgreSQL is reachable.
export async function GET(){
 const headers={"Cache-Control":"no-store"};
 try{
  await sql("SELECT 1");
  return Response.json({status:"ok"},{headers});
 }catch{
  return Response.json({status:"database_unavailable"},{status:503,headers});
 }
}
