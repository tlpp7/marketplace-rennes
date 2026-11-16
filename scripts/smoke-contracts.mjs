import assert from "node:assert/strict";
// Against CI's localhost Next.js server only, never production Railway.
const base=new URL(process.env.RF_V052_CONTRACT_BASE??"http://127.0.0.1:3000");
if(!["127.0.0.1","localhost","[::1]"].includes(base.hostname))
 throw Error("Contract smoke must run against localhost");
async function check(path,{method="GET",origin,body}={}){
 const headers={};if(origin)headers.Origin=origin;
 if(body){headers["Content-Type"]="application/json"}
 const result=await fetch(new URL(path,base),{
  method,redirect:"manual",headers,body:body?JSON.stringify(body):undefined
 });
 const data=await result.json();
 return {status:result.status,data};
}
const cases=[
 {name:"owner consignments requires auth",path:"/api/consignments/",status:401,error:"Connexion requise"},
 {name:"owner orders requires auth",path:"/api/orders/",status:401,error:"Connexion requise"},
 {name:"admin consignments requires admin",path:"/api/admin/consignments/",status:403,error:"Accès refusé"},
 {name:"admin orders requires admin",path:"/api/admin/orders/",status:403,error:"Accès refusé"},
 {name:"admin inventory requires admin",path:"/api/admin/inventory/",status:403,error:"Accès refusé"},
 {name:"consignment POST CSRF first",path:"/api/consignments/",method:"POST",body:{},status:403,error:"Origine non autorisée"},
 {name:"consignment withdrawal CSRF first",path:"/api/consignments/00000000-0000-0000-0000-000000000000/",method:"PATCH",body:{action:"withdraw"},status:403,error:"Origine non autorisée"},
 {name:"admin inventory CSRF first",path:"/api/admin/inventory/00000000-0000-0000-0000-000000000000/",method:"PATCH",body:{state:"listed"},status:403,error:"Origine non autorisée"},
 {name:"order cancellation CSRF first",path:"/api/orders/00000000-0000-0000-0000-000000000000/",method:"PATCH",body:{action:"cancel"},status:403,error:"Origine non autorisée"},
 {name:"orders feature gate before authentication",path:"/api/orders/",method:"POST",body:{sku:"RF-0000001"},status:503,error:"Demandes de commande désactivées"}
];
for(const expected of cases){
 const observed=await check(expected.path,expected);
 assert.deepEqual(observed,{status:expected.status,data:{error:expected.error}},expected.name);
}
console.log("V0.5.2 API contracts: "+cases.length+" unchanged unauthenticated responses (status + JSON envelope)");
