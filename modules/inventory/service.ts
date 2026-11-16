import {allowedAdminTransition} from "./state-machine";
import {accepted,rejected,type DomainResult} from "@/modules/domain/result";
import type {InventoryTransition,InventoryUnitOfWork} from "./contracts";
export function createInventoryService(unit:InventoryUnitOfWork){
 return {
  async changeState(command:InventoryTransition):Promise<DomainResult<{state:string}>>{
   return unit.transaction(async tx=>{
    const previous=await tx.lockState(command.itemId);
    if(previous===null)return rejected(404,"Article introuvable");
    if(!allowedAdminTransition(previous,command.target))return rejected(409,"Transition impossible");
    await tx.changeState(command.itemId,command.target,command.location);
    await tx.appendMovement(command.itemId,command.actorId,previous,command.target);
    return accepted({state:command.target});
   });
  }
 };
}
