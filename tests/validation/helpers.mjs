import assert from "node:assert/strict";
const raw=process.env.RF_TEST_BASE ?? "http://127.0.0.1:3100";
const base=new URL(raw);
assert.ok(["localhost","127.0.0.1","[::1]"].includes(base.hostname),"Tests autorisés uniquement sur localhost");
assert.ok(["http:","https:"].includes(base.protocol));
export const origin=base.origin;
export const cookie=process.env.RF_TEST_COOKIE ?? "";
export async function request(path,{method="GET",session="",body,foreignOrigin=false}={}){
 const headers={...(session?{Cookie:session}:{}),...(body!==undefined?{"Content-Type":"application/json"}:{})};
 if(method!=="GET")headers.Origin=foreignOrigin?"https://attacker.example":origin;
 const response=await fetch(new URL(path,base),{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:"manual"});
 let data=null;try{data=await response.json()}catch{}
 return {status:response.status,data};
}
