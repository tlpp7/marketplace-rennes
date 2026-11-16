import {db} from "@/lib/db";
import type {ReviewUnitOfWork,ReviewTransaction,ReviewStatus} from "./review-contracts";
export const postgresReviewUnitOfWork:ReviewUnitOfWork={
 async transaction<T>(fn:(tx:ReviewTransaction)=>Promise<T>):Promise<T>{
  const client=await db.connect();
  try{
   await client.query("BEGIN");
   const result=await fn({
    async lock(id){
     const rows=await client.query<{id:string;status:string;estimated_price_cents:number}>(
      "SELECT id,status,estimated_price_cents FROM consignment_requests WHERE id=$1 FOR UPDATE",[id]);
     const row=rows.rows[0];
     return row?{id:row.id,status:row.status,estimatedPriceCents:row.estimated_price_cents}:null;
    },
    async setStatus(id,status:ReviewStatus){
     await client.query("UPDATE consignment_requests SET status=$2 WHERE id=$1",[id,status]);
    },
    async createInventory(id,actorId,priceCents,commissionBps){
     const number=await client.query<{n:string}>("SELECT nextval('rennfripes_sku_seq') AS n");
     const sku="RF-"+String(number.rows[0].n).padStart(7,"0");
     const item=await client.query<{id:string}>(
      "INSERT INTO consignment_inventory(request_id,sku,list_price_cents,commission_bps) VALUES($1,$2,$3,$4) RETURNING id",
      [id,sku,priceCents,commissionBps]);
     await client.query("INSERT INTO stock_movements(item_id,actor_id,to_state,description) VALUES($1,$2,'intake','Acceptation du dépôt')",[item.rows[0].id,actorId]);
    }
   });
   await client.query("COMMIT");
   return result;
  }catch(error){
   await client.query("ROLLBACK").catch(()=>{});
   throw error;
  }finally{client.release()}
 }
};
