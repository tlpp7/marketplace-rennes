import {currentAdmin} from "@/lib/admin";
import {fail} from "@/lib/security";
import {createOrderService} from "@/modules/orders/service";
import {postgresOrderRepository} from "@/modules/orders/repository.pg";
export const runtime="nodejs";
const service=createOrderService(postgresOrderRepository);
export async function GET(){
 if(!await currentAdmin())return fail("Accès refusé",403);
 return Response.json({orders:await service.listForAdmin()});
}
