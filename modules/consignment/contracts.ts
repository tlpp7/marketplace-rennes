/** Public application contracts — no Next.js, HTTP or PostgreSQL imports. */
export type ConsignmentStatus="submitted"|"reviewing"|"accepted"|"declined"|"withdrawn";
export type ConsignmentCondition="new"|"very_good"|"good"|"fair";
export type CreatedConsignment={id:string;status:string};
export type ConsignmentDraft={
 ownerId:string;title:string;category:string;brand:string;condition:string;notes:string;estimatedPriceCents:number
};
export interface ConsignmentRepository{
 listForOwner(ownerId:string):Promise<unknown[]>;
 create(draft:ConsignmentDraft):Promise<CreatedConsignment>;
 withdraw(id:string,ownerId:string):Promise<CreatedConsignment|null>;
 listForAdmin():Promise<unknown[]>;
}
