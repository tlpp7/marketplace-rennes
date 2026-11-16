/** Transport-independent result returned by application services. */
export type DomainResult<T> =
 | {ok:true;value:T}
 | {ok:false;status:number;error:string};

export function accepted<T>(value:T):DomainResult<T>{return {ok:true,value}}
export function rejected(status:number,error:string):DomainResult<never>{return {ok:false,status,error}}
/** Convert results to their historical HTTP envelopes only in route handlers. */
export function textField(value:unknown,max:number):string{
 return typeof value==="string"?value.trim().slice(0,max):"";
}
