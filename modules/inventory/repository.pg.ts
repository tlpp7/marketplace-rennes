import {db} from "@/lib/db";
import type {InventoryUnitOfWork,InventoryTransaction} from "./contracts";
export const postgresInventoryUnitOfWork:InventoryUnitOfWork={
 async transaction<T>(fn:(tx:InventoryTransaction)=>Promise<T>):Promise<T>{
  const client=await db.connect();
  try{
   await client.query("BEGIN");
   const value=await fn({
    async lockState(itemId){
     const rows=await client.query<{state:string}>("SELECT state FROM consignment_inventory WHERE id=$1 FOR UPDATE",[itemId]);
     return rows.rows[0]?.state??null;
    },
    async changeState(itemId,target,location){
     await client.query("UPDATE consignment_inventory SET state=$2,location_code=$3,updated_at=now() WHERE id=$1",[itemId,target,location]);
    },
    async appendMovement(itemId,actorId,from,to){
     await client.query("INSERT INTO stock_movements(item_id,actor_id,from_state,to_state,description) VALUES($1,$2,$3,$4,$5)",[itemId,actorId,from,to,"Transition administrateur"]);
    }
   });
   await client.query("COMMIT");
   return value;
  }catch(error){
   await client.query("ROLLBACK").catch(()=>{});
   throw error;
  }finally{client.release()}
 }
};
