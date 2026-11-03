import {currentAdmin} from "@/lib/admin";
import {sql} from "@/lib/db";
import {fail} from "@/lib/security";
export const runtime="nodejs";
export async function GET(){
 if(!await currentAdmin())return fail("Accès refusé",403);
 try{
  const items=await sql("SELECT i.id,i.sku,i.state,i.location_code,i.list_price_cents,i.commission_bps,r.title,u.handle AS deposant,rc.proof_reference AS receipt_reference,rc.received_at,q.verdict AS quality_verdict,(m.item_id IS NOT NULL) AS mandate_accepted,p.photo_url AS public_photo_url,p.size_label AS public_size,p.public_description FROM consignment_inventory i JOIN consignment_requests r ON r.id=i.request_id JOIN users u ON u.id=r.owner_id LEFT JOIN consignment_receipts rc ON rc.item_id=i.id LEFT JOIN consignment_quality_reports q ON q.item_id=i.id LEFT JOIN consignment_mandates m ON m.item_id=i.id LEFT JOIN consignment_publications p ON p.item_id=i.id ORDER BY i.received_at DESC LIMIT 200");
  return Response.json({items});
 }catch{return fail("Inventaire indisponible : vérifie la migration V0.2",503)}
}
