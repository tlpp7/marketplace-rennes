/** Atomic inventory operations are independent of a particular DB driver. */
export interface InventoryTransaction{
 lockState(itemId:string):Promise<string|null>;
 changeState(itemId:string,target:string,location:string):Promise<void>;
 appendMovement(itemId:string,actorId:string,from:string,to:string):Promise<void>;
}
export interface InventoryUnitOfWork{
 transaction<T>(fn:(tx:InventoryTransaction)=>Promise<T>):Promise<T>;
}
export type InventoryTransition={itemId:string;actorId:string;target:string;location:string};
