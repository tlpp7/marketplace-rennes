export type ReviewAction="review"|"accept"|"decline";
export type ReviewStatus="submitted"|"reviewing"|"accepted"|"declined";
export type ReviewCommand={id:string;actorId:string;action:string;commissionBps:unknown};
export type LockedConsignment={id:string;status:string;estimatedPriceCents:number};
export interface ReviewTransaction{
 lock(id:string):Promise<LockedConsignment|null>;
 setStatus(id:string,status:ReviewStatus):Promise<void>;
 createInventory(id:string,actorId:string,priceCents:number,commissionBps:number):Promise<void>;
}
export interface ReviewUnitOfWork{
 transaction<T>(fn:(tx:ReviewTransaction)=>Promise<T>):Promise<T>;
}
