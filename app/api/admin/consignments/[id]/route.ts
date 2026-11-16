import {currentAdmin} from "@/lib/admin";
import {body,fail,stringField,trustedRequest} from "@/lib/security";
import {createReviewService} from "@/modules/consignment/review-service";
import {postgresReviewUnitOfWork} from "@/modules/consignment/review.pg";
export const runtime="nodejs";
const service=createReviewService(postgresReviewUnitOfWork);
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!await trustedRequest(request))return fail("Origine non autorisée",403);
 const admin=await currentAdmin();if(!admin)return fail("Accès refusé",403);
 const {id}=await params,data=await body(request),action=stringField(data.action,20);
 try{
  const result=await service.transition({id,actorId:admin.id,action,commissionBps:data.commissionBps});
  return result.ok?Response.json(result.value):fail(result.error,result.status);
 }catch{return fail("Opération non enregistrée",500)}
}
