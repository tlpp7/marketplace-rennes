import {currentAdmin} from "@/lib/admin";
import {body,fail,stringField,trustedRequest} from "@/lib/security";
import {createInventoryService} from "@/modules/inventory/service";
import {postgresInventoryUnitOfWork} from "@/modules/inventory/repository.pg";
export const runtime="nodejs";
const service=createInventoryService(postgresInventoryUnitOfWork);
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!await trustedRequest(request))return fail("Origine non autorisée",403);
 const admin=await currentAdmin();if(!admin)return fail("Accès refusé",403);
 const {id}=await params,data=await body(request);
 const target=stringField(data.state,24),location=stringField(data.location,48);
 try{
  const result=await service.changeState({itemId:id,actorId:admin.id,target,location});
  return result.ok?Response.json(result.value):fail(result.error,result.status);
 }catch{return fail("Transition échouée",500)}
}
