import {sql} from "@/lib/db";
import type {ConsignmentDraft,ConsignmentRepository,CreatedConsignment} from "./contracts";
export const postgresConsignmentRepository:ConsignmentRepository={
 listForOwner:ownerId=>sql("SELECT r.id,r.title,r.category,r.brand,r.condition_label,r.estimated_price_cents,r.status,r.created_at,i.sku,i.state AS inventory_state,(m.item_id IS NOT NULL) AS mandate_accepted,rc.receipt_document,rc.receipt_sha256,rc.received_at,q.verdict AS quality_verdict,p.published_at FROM consignment_requests r LEFT JOIN consignment_inventory i ON i.request_id=r.id LEFT JOIN consignment_mandates m ON m.item_id=i.id LEFT JOIN consignment_receipts rc ON rc.item_id=i.id LEFT JOIN consignment_quality_reports q ON q.item_id=i.id LEFT JOIN consignment_publications p ON p.item_id=i.id WHERE r.owner_id=$1 ORDER BY r.created_at DESC LIMIT 100",[ownerId]),
 async create(draft:ConsignmentDraft):Promise<CreatedConsignment>{
  const rows=await sql<CreatedConsignment>("INSERT INTO consignment_requests(owner_id,title,category,brand,condition_label,notes,estimated_price_cents) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,status",[draft.ownerId,draft.title,draft.category,draft.brand,draft.condition,draft.notes,draft.estimatedPriceCents]);
  return rows[0];
 },
 async withdraw(id,ownerId){
  const rows=await sql<CreatedConsignment>("UPDATE consignment_requests SET status='withdrawn' WHERE id=$1 AND owner_id=$2 AND status='submitted' RETURNING id,status",[id,ownerId]);
  return rows[0]??null;
 },
 listForAdmin:()=>sql("SELECT r.id,r.title,r.category,r.brand,r.condition_label,r.estimated_price_cents,r.status,r.created_at,u.handle AS deposant,i.sku,i.state AS inventory_state,i.location_code FROM consignment_requests r JOIN users u ON r.owner_id=u.id LEFT JOIN consignment_inventory i ON i.request_id=r.id ORDER BY r.created_at DESC LIMIT 200")
};
