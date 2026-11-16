import {accepted,rejected,type DomainResult} from "@/modules/domain/result";
import type {OrderRepository,OrderSummary} from "./contracts";
const SKU=/^RF-[0-9]{7}$/;
export function isValidSku(value:string):boolean{return SKU.test(value)}
export function createOrderService(repo:OrderRepository){
 return {
  listForBuyer:(buyerId:string)=>repo.listForBuyer(buyerId),
  listForAdmin:()=>repo.listForAdmin(),
  async request(buyerId:string,sku:string):Promise<DomainResult<OrderSummary>>{
   if(!isValidSku(sku))return rejected(400,"Référence invalide");
   const order=await repo.request(buyerId,sku);
   return order?accepted(order):rejected(409,"Article indisponible");
  },
  async cancel(id:string,buyerId:string):Promise<DomainResult<OrderSummary>>{
   const order=await repo.cancel(id,buyerId);
   return order?accepted(order):rejected(409,"Annulation impossible");
  }
 }
}
