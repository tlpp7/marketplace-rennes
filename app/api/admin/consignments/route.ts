import {currentAdmin} from "@/lib/admin";
import {fail} from "@/lib/security";
import {createConsignmentService} from "@/modules/consignment/service";
import {postgresConsignmentRepository} from "@/modules/consignment/repository.pg";
export const runtime="nodejs";
const service=createConsignmentService(postgresConsignmentRepository);
export async function GET(){
 try{
  if(!await currentAdmin())return fail("Accès refusé",403);
  return Response.json({requests:await service.listForAdmin()});
 }catch{return fail("Administration indisponible",503)}
}
