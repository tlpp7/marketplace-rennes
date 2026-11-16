import {accepted,rejected,type DomainResult} from "@/modules/domain/result";
import type {ReviewCommand,ReviewStatus,ReviewUnitOfWork} from "./review-contracts";
export function createReviewService(unit:ReviewUnitOfWork){
 return {
  async transition(command:ReviewCommand):Promise<DomainResult<{id:string;status:ReviewStatus}>>{
   if(!["review","accept","decline"].includes(command.action))
    return rejected(400,"Action invalide");
   return unit.transaction(async tx=>{
    const item=await tx.lock(command.id);
    if(!item)return rejected(404,"Demande introuvable");
    const allowed=(command.action==="review"&&item.status==="submitted")||
      (["accept","decline"].includes(command.action)&&item.status==="reviewing");
    if(!allowed)return rejected(409,"Transition interdite");
    if(command.action==="accept"){
     const commissionBps=Number(command.commissionBps);
     if(!Number.isInteger(commissionBps)||commissionBps<0||commissionBps>10000)
      return rejected(400,"Commission invalide");
     await tx.setStatus(command.id,"accepted");
     await tx.createInventory(command.id,command.actorId,item.estimatedPriceCents,commissionBps);
     return accepted({id:command.id,status:"accepted"});
    }
    const status:ReviewStatus=command.action==="review"?"reviewing":"declined";
    await tx.setStatus(command.id,status);
    return accepted({id:command.id,status});
   });
  }
 };
}
