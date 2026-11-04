import {db,sql} from "@/lib/db";
import {currentUser,body,fail,stringField,trustedRequest} from "@/lib/security";
import {mandatePreview,finalizedMandate} from "@/lib/consignment-mandate";
export const runtime="nodejs";
type Item={id:string;sku:string;title:string;list_price_cents:number;commission_bps:number};
async function ownedItem(id:string,ownerId:string){
 const rows=await sql<Item>("SELECT i.id,i.sku,r.title,i.list_price_cents,i.commission_bps FROM consignment_inventory i JOIN consignment_requests r ON r.id=i.request_id WHERE r.id=$1 AND r.owner_id=$2 AND r.status='accepted'",[id,ownerId]);
 return rows[0]??null;
}
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const user=await currentUser();if(!user)return fail("Connexion requise",401);
 try{
  const {id}=await params,item=await ownedItem(id,user.id);if(!item)return fail("Dépôt introuvable",404);
  const existing=await sql("SELECT document_text,document_sha256,accepted_at,terms_version FROM consignment_mandates WHERE item_id=$1 AND owner_id=$2",[item.id,user.id]);
  if(existing.length)return Response.json({accepted:true,mandate:existing[0]});
  const preview=mandatePreview(item);
  return Response.json({accepted:false,preview:preview.text,previewSha256:preview.sha256,version:preview.version,priceCents:item.list_price_cents,commissionBps:item.commission_bps});
 }catch{return fail("Mandat non configuré ou base indisponible",503)}
}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!await trustedRequest(request))return fail("Origine non autorisée",403);
 const user=await currentUser();if(!user)return fail("Connexion requise",401);
 let data:Record<string,unknown>;
 try{data=await body(request)}catch{return fail("Données invalides",400)}
 const depositorName=stringField(data.depositorName,160),depositorAddress=stringField(data.depositorAddress,350);
 if(data.accept!==true||depositorName.length<4||depositorAddress.length<8||
 typeof data.priceCents!=="number"||!Number.isSafeInteger(data.priceCents)||typeof data.commissionBps!=="number"||!Number.isSafeInteger(data.commissionBps)||
 typeof data.version!=="string"||typeof data.previewSha256!=="string"||!/^[a-f0-9]{64}$/.test(data.previewSha256))return fail("Identité et consentement explicite requis",400);
 const {id}=await params;
 const client=await db.connect();
 try{
  await client.query("BEGIN");
  const result=await client.query("SELECT i.id,i.sku,r.title,i.list_price_cents,i.commission_bps FROM consignment_inventory i JOIN consignment_requests r ON r.id=i.request_id WHERE r.id=$1 AND r.owner_id=$2 AND r.status='accepted' FOR UPDATE OF i",[id,user.id]);
  if(!result.rows.length){await client.query("ROLLBACK");return fail("Dépôt introuvable",404)}
  const item=result.rows[0] as Item;
  const terms=finalizedMandate(item,depositorName,depositorAddress);
  const currentPreview=mandatePreview(item);
  if(data.previewSha256!==currentPreview.sha256||data.version!==terms.version||data.priceCents!==item.list_price_cents||data.commissionBps!==item.commission_bps){
   await client.query("ROLLBACK");return fail("Conditions modifiées : recharge le mandat",409);
  }
  const already=await client.query("SELECT item_id FROM consignment_mandates WHERE item_id=$1",[item.id]);
  if(already.rowCount){await client.query("ROLLBACK");return fail("Mandat déjà accepté",409)}
  await client.query("INSERT INTO consignment_mandates(item_id,owner_id,depositor_name,depositor_address,terms_version,document_text,document_sha256) VALUES($1,$2,$3,$4,$5,$6,$7)",
   [item.id,user.id,depositorName,depositorAddress,terms.version,terms.document,terms.sha256]);
  await client.query("COMMIT");
  return Response.json({accepted:true,sha256:terms.sha256},{status:201});
 }catch{
  await client.query("ROLLBACK").catch(()=>{});
  return fail("Mandat non enregistré",503);
 }finally{client.release()}
}
