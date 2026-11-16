import {body,currentUser,fail,trustedRequest} from "@/lib/security";
import {createConsignmentService} from "@/modules/consignment/service";
import {postgresConsignmentRepository} from "@/modules/consignment/repository.pg";
export const runtime="nodejs";
const service=createConsignmentService(postgresConsignmentRepository);
export async function GET(){
 try{
  const user=await currentUser();if(!user)return fail("Connexion requise",401);
  return Response.json({requests:await service.listForOwner(user.id)});
 }catch{return fail("Dépôts indisponibles",503)}
}
export async function POST(request:Request){
 try{
  if(!await trustedRequest(request))return fail("Origine non autorisée",403);
  const user=await currentUser();if(!user)return fail("Connexion requise",401);
  const result=await service.create(user.id,await body(request));
  return result.ok?Response.json({request:result.value},{status:201}):fail(result.error,result.status);
 }catch{return fail("Demande non enregistrée",503)}
}
