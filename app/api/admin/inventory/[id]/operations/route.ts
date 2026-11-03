import {createHash} from "node:crypto";
import {db} from "@/lib/db";
import {currentAdmin} from "@/lib/admin";
import {body,fail,stringField,trustedRequest} from "@/lib/security";
export const runtime="nodejs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validPhoto(url:string){
 if(/^\/consignments\/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp)$/i.test(url)&&!url.includes(".."))return true;
 try{
  const u=new URL(url);
  const hosts=(process.env.CONSIGNMENT_MEDIA_HOSTS??"").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
  return u.protocol==="https:"&&!u.username&&!u.password&&hosts.includes(u.hostname.toLowerCase());
 }catch{return false}
}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!await trustedRequest(request))return fail("Origine non autorisée",403);
 const admin=await currentAdmin();if(!admin)return fail("Accès administrateur requis",403);
 const {id}=await params;if(!uuid.test(id))return fail("Référence invalide",400);
 let d:Record<string,unknown>;
 try{d=await body(request)}catch{return fail("Corps invalide",400)}
 const action=stringField(d.action,24);
 if(!["receive","quality","publish"].includes(action))return fail("Action inconnue",400);
 const client=await db.connect();
 try{
  await client.query("BEGIN");
  const locked=await client.query("SELECT i.id,i.state,i.sku,r.title FROM consignment_inventory i JOIN consignment_requests r ON r.id=i.request_id WHERE i.id=$1 FOR UPDATE OF i",[id]);
  if(!locked.rows.length){await client.query("ROLLBACK");return fail("Article introuvable",404)}
  const item=locked.rows[0];
  let nextState="";
  let detail="";
  if(action==="receive"){
   if(item.state!=="intake"){await client.query("ROLLBACK");return fail("Réception déjà traitée",409)}
   const mandate=await client.query("SELECT item_id FROM consignment_mandates WHERE item_id=$1",[id]);
   if(!mandate.rowCount){await client.query("ROLLBACK");return fail("Le déposant doit accepter le mandat avant la réception",409)}
   const reference=stringField(d.proofReference,80),location=stringField(d.location,48),notes=stringField(d.notes,1000);
   if(d.physicallyReceived!==true||reference.length<4||location.length<2){
    await client.query("ROLLBACK");return fail("Confirme la réception, la référence du bordereau et l'emplacement",400);
   }
   const at=new Date().toISOString();
   const document=["ATTESTATION DE RÉCEPTION PHYSIQUE — RENN’FRIPES","SKU : "+item.sku,"Vêtement : "+item.title,"Bordereau : "+reference,"Emplacement : "+location,"Réception déclarée par : "+admin.handle+" ("+admin.id+")","Date UTC : "+at,"Observations : "+notes].join("\n");
   const hash=createHash("sha256").update(document,"utf8").digest("hex");
   await client.query("INSERT INTO consignment_receipts(item_id,receiver_id,proof_reference,location_code,notes,receipt_document,receipt_sha256,received_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
    [id,admin.id,reference,location,notes,document,hash,at]);
   await client.query("UPDATE consignment_inventory SET state='quality_check',location_code=$2,received_at=$3,updated_at=now() WHERE id=$1",[id,location,at]);
   nextState="quality_check";detail="Réception physique attestée : "+reference;
  }
  if(action==="quality"){
   if(item.state!=="quality_check"){await client.query("ROLLBACK");return fail("Article non prêt pour le contrôle",409)}
   const verdict=d.verdict,notes=stringField(d.notes,1000);
   const raw=d.checks;
   if(!raw||typeof raw!=="object"||Array.isArray(raw)||!["passed","rejected"].includes(String(verdict))){
    await client.query("ROLLBACK");return fail("Contrôle qualité incomplet",400);
   }
   const c=raw as Record<string,unknown>;
   const checks={labelMatches:c.labelMatches===true,clean:c.clean===true,conditionMatches:c.conditionMatches===true,photoVerified:c.photoVerified===true};
   if((verdict==="passed"&&!Object.values(checks).every(Boolean))||(verdict==="rejected"&&notes.length<8)){
    await client.query("ROLLBACK");return fail("Tous les critères sont requis pour accepter ; un motif est requis pour refuser",400);
   }
   await client.query("INSERT INTO consignment_quality_reports(item_id,inspector_id,verdict,checks,notes) VALUES($1,$2,$3,$4::jsonb,$5)",
    [id,admin.id,verdict,JSON.stringify(checks),notes]);
   nextState=verdict==="passed"?"ready":"returned";
   await client.query("UPDATE consignment_inventory SET state=$2,updated_at=now() WHERE id=$1",[id,nextState]);
   detail="Contrôle qualité "+(verdict==="passed"?"validé":"refusé");
  }
  if(action==="publish"){
   if(item.state!=="ready"){await client.query("ROLLBACK");return fail("Article non prêt à publier",409)}
   const size=stringField(d.size,40),photoUrl=stringField(d.photoUrl,1000),description=stringField(d.description,1500);
   if(!size||description.length<20||!validPhoto(photoUrl)){
    await client.query("ROLLBACK");return fail("Taille, description et photo HTTPS issue d'un hôte autorisé requises",400);
   }
   const evidence=await client.query("SELECT (SELECT count(*) FROM consignment_receipts WHERE item_id=$1) AS receipt,(SELECT count(*) FROM consignment_quality_reports WHERE item_id=$1 AND verdict='passed') AS quality,(SELECT count(*) FROM consignment_mandates WHERE item_id=$1) AS mandate",[id]);
   const e=evidence.rows[0];
   if(Number(e.receipt)!==1||Number(e.quality)!==1||Number(e.mandate)!==1){
    await client.query("ROLLBACK");return fail("Réception, contrôle qualité ou mandat manquant",409);
   }
   await client.query("INSERT INTO consignment_publications(item_id,publisher_id,size_label,photo_url,public_description) VALUES($1,$2,$3,$4,$5)",
    [id,admin.id,size,photoUrl,description]);
   await client.query("UPDATE consignment_inventory SET state='listed',updated_at=now() WHERE id=$1",[id]);
   nextState="listed";detail="Publication du vêtement au catalogue";
  }
  await client.query("INSERT INTO stock_movements(item_id,actor_id,from_state,to_state,description) VALUES($1,$2,$3,$4,$5)",
   [id,admin.id,item.state,nextState,detail]);
  await client.query("COMMIT");
  return Response.json({itemId:id,state:nextState,notice:detail});
 }catch{
  await client.query("ROLLBACK").catch(()=>{});
  return fail("Opération non enregistrée",503);
 }finally{client.release()}
}
