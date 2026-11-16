import {body,currentUser,fail,trustedRequest} from "@/lib/security";
import {createConsignmentService} from "@/modules/consignment/service";
import {postgresConsignmentRepository} from "@/modules/consignment/repository.pg";
export const runtime="nodejs";
const service=createConsignmentService(postgresConsignmentRepository);
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!await trustedRequest(request))return fail("Origine non autorisée",403);
 const user=await currentUser();if(!user)return fail("Connexion requise",401);
 const {id}=await params,data=await body(request);
 if(data.action!=="withdraw")return fail("Action interdite");
 const result=await service.withdraw(id,user.id);
 return result.ok?Response.json({request:result.value}):fail(result.error,result.status);
}
