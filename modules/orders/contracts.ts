/** Domain contracts preserve the historical response field names. */
export type OrderSummary={id:string;status:string};
export interface OrderRepository{
 listForBuyer(buyerId:string):Promise<unknown[]>;
 listForAdmin():Promise<unknown[]>;
 request(buyerId:string,sku:string):Promise<OrderSummary|null>;
 cancel(id:string,buyerId:string):Promise<OrderSummary|null>;
}
