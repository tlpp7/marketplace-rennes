import {sql} from "@/lib/db";
import type {Product} from "./types";
type LiveRow={
 sku:string;title:string;brand:string;category:string;condition_label:string;
 list_price_cents:number;location_code:string;size_label:string;photo_url:string;public_description:string
};
const whereClause=" FROM consignment_inventory i JOIN consignment_requests r ON r.id=i.request_id JOIN consignment_publications p ON p.item_id=i.id JOIN consignment_receipts rc ON rc.item_id=i.id JOIN consignment_quality_reports q ON q.item_id=i.id AND q.verdict='passed' JOIN consignment_mandates m ON m.item_id=i.id WHERE i.state='listed'";
const fields="SELECT i.sku,r.title,r.brand,r.category,r.condition_label,i.list_price_cents,i.location_code,p.size_label,p.photo_url,p.public_description";
function toProduct(r:LiveRow):Product{
 const condition:Record<string,string>={new:"Neuf",very_good:"Très bon état",good:"Bon état",fair:"État correct"};
 return {
  id:r.sku,slug:r.sku.toLowerCase(),name:r.title,brand:r.brand||"Sans marque",
  category:r.category,size:r.size_label,condition:condition[r.condition_label]??r.condition_label,
  price:Number(r.list_price_cents)/100,currency:"EUR",location:"Rennes",
  status:"available",images:[r.photo_url],description:r.public_description,saleMode:"consignment",
  demo:false
 };
}
export async function getLiveProducts():Promise<Product[]>{
 const items=await sql<LiveRow>(fields+whereClause+" ORDER BY p.published_at DESC LIMIT 200");
 return items.map(toProduct);
}
export async function getLiveProductBySlug(slug:string):Promise<Product|undefined>{
 if(!/^rf-\d{7}$/.test(slug))return undefined;
 const items=await sql<LiveRow>(fields+whereClause+" AND i.sku=$1 LIMIT 1",[slug.toUpperCase()]);
 return items.length?toProduct(items[0]):undefined;
}
