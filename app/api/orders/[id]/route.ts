import {body,currentUser,fail,trustedRequest} from "@/lib/security";
import {createOrderService} from "@/modules/orders/service";
import {postgresOrderRepository} from "@/modules/orders/repository.pg";
export const runtime="nodejs";
const service=createOrderService(postgresOrderRepository);
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!await trustedRequest(request))return fail("Origine non autorisée",403);
 const user=await currentUser();if(!user)return fail("Connexion requise",401);
 const data=await body(request);
 if(data.action!=="cancel")return fail("Action inconnue");
 const {id}=await params,result=await service.cancel(id,user.id);
 return result.ok?Response.json({order:result.value}):fail(result.error,result.status);
}
