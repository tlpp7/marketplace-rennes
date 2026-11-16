/** Pure CSRF Origin policy; proxy Host headers never authorize writes. */
const loopback=new Set(["localhost","127.0.0.1","[::1]"]);
export function isTrustedOrigin(raw:string|null,configuredOrigin:string|undefined,requestUrl:string,production:boolean):boolean{
 if(!raw)return false;
 try{
  const origin=new URL(raw);
  if(!["http:","https:"].includes(origin.protocol)||
     origin.username||origin.password||origin.search||origin.hash||origin.pathname!=="/")return false;
  if(configuredOrigin)return origin.origin===configuredOrigin;
  if(production)return false;
  const target=new URL(requestUrl);
  return loopback.has(origin.hostname)&&loopback.has(target.hostname)&&
    origin.protocol===target.protocol&&origin.port===target.port;
 }catch{return false}
}
