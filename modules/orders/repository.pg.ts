import {sql} from "@/lib/db";
import type {OrderRepository,OrderSummary} from "./contracts";
export const postgresOrderRepository:OrderRepository={
 listForBuyer:buyerId=>sql("SELECT o.id,o.price_cents,o.status,o.created_at,i.sku,s.method,s.status AS shipment_status,s.tracking_reference FROM marketplace_orders o JOIN consignment_inventory i ON i.id=o.inventory_id LEFT JOIN shipments s ON s.order_id=o.id WHERE o.buyer_id=$1 ORDER BY o.created_at DESC LIMIT 50",[buyerId]),
 listForAdmin:()=>sql("SELECT o.id,o.status,o.price_cents,o.created_at,u.handle AS buyer,i.sku,s.status AS shipping_status FROM marketplace_orders o JOIN users u ON u.id=o.buyer_id JOIN consignment_inventory i ON i.id=o.inventory_id LEFT JOIN shipments s ON s.order_id=o.id ORDER BY o.created_at DESC LIMIT 100"),
 async request(buyerId:string,sku:string):Promise<OrderSummary|null>{
  const rows=await sql<OrderSummary>("INSERT INTO marketplace_orders(buyer_id,inventory_id,price_cents) SELECT $1,i.id,i.list_price_cents FROM consignment_inventory i JOIN consignment_requests r ON r.id=i.request_id WHERE i.sku=$2 AND i.state='listed' AND r.owner_id<>$1 AND NOT EXISTS(SELECT 1 FROM marketplace_orders o WHERE o.inventory_id=i.id) RETURNING id,status",[buyerId,sku]);
  return rows[0]??null;
 },
 async cancel(id:string,buyerId:string):Promise<OrderSummary|null>{
  const rows=await sql<OrderSummary>("UPDATE marketplace_orders SET status='cancelled',updated_at=now() WHERE id=$1 AND buyer_id=$2 AND status='requested' RETURNING id,status",[id,buyerId]);
  return rows[0]??null;
 }
};
