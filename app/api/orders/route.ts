import {getServerConfig} from "@/lib/config/env";
import {body,currentUser,fail,stringField,trustedRequest} from "@/lib/security";
import {createOrderService} from "@/modules/orders/service";
import {postgresOrderRepository} from "@/modules/orders/repository.pg";
export const runtime="nodejs";
const service=createOrderService(postgresOrderRepository);
export async function GET(){
 try{
  const user=await currentUser();if(!user)return fail("Connexion requise",401);
  return Response.json({orders:await service.listForBuyer(user.id)});
 }catch{return fail("Commandes indisponibles",503)}
}
export async function POST(request:Request){
 try{
  if(getServerConfig().production||!getServerConfig().flags.ordersEnabled)return fail("Demandes de commande désactivées",503);
  if(!await trustedRequest(request))return fail("Origine non autorisée",403);
  const user=await currentUser();if(!user)return fail("Connexion requise",401);
  const data=await body(request),sku=stringField(data.sku,48);
  const result=await service.request(user.id,sku);
  return result.ok?Response.json({order:result.value,notice:"Demande enregistrée, aucun paiement encaissé"},{status:201}):fail(result.error,result.status);
 }catch{return fail("Commande non enregistrée",503)}
}
