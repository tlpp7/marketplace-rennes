export const runtime="nodejs";
export const dynamic="force-dynamic";

// Liveness does not depend on PostgreSQL; useful for diagnosing DB outages.
export function GET(){
 return Response.json({status:"alive"},{headers:{"Cache-Control":"no-store"}});
}
