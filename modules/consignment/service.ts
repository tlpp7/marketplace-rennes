import {accepted,rejected,textField,type DomainResult} from "@/modules/domain/result";
import type {ConsignmentDraft,ConsignmentRepository,CreatedConsignment} from "./contracts";
const conditions=new Set(["new","very_good","good","fair"]);
export function parseConsignmentDraft(ownerId:string,input:Record<string,unknown>):
 DomainResult<ConsignmentDraft>{
 const title=textField(input.title,160),category=textField(input.category,80),
 brand=textField(input.brand,80),condition=textField(input.condition,40),
 notes=textField(input.notes,1000),estimatedPriceCents=Number(input.estimatedPriceCents);
 if(title.length<4||!category||!conditions.has(condition)||
  !Number.isSafeInteger(estimatedPriceCents)||estimatedPriceCents<0||estimatedPriceCents>10000000)
  return rejected(400,"Informations invalides");
 return accepted({ownerId,title,category,brand,condition,notes,estimatedPriceCents});
}
export function createConsignmentService(repo:ConsignmentRepository){
 return {
  listForOwner:(ownerId:string)=>repo.listForOwner(ownerId),
  listForAdmin:()=>repo.listForAdmin(),
  async create(ownerId:string,input:Record<string,unknown>):Promise<DomainResult<CreatedConsignment>>{
   const parsed=parseConsignmentDraft(ownerId,input);
   if(!parsed.ok)return parsed;
   return accepted(await repo.create(parsed.value));
  },
  async withdraw(id:string,ownerId:string):Promise<DomainResult<CreatedConsignment>>{
   const result=await repo.withdraw(id,ownerId);
   return result?accepted(result):rejected(409,"Demande introuvable ou déjà en cours de traitement");
  }
 }
}
