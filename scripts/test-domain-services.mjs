import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {posix} from "node:path";
import ts from "typescript";

// Test dependency-injected TypeScript domain services with Node's native runner.
// Transpilation is confined to tests; no new runtime package or DB is required.
const cache=new Map();
async function loadDomain(path){
 if(cache.has(path))return cache.get(path);
 const source=await readFile(new URL("../"+path,import.meta.url),"utf8");
 let javascript=ts.transpileModule(source,{compilerOptions:{
  target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext
 }}).outputText;
 const imports=[...javascript.matchAll(/from\s+["']([^"']+)["']/g)];
 for(const match of imports){
  const spec=match[1];
  if(!spec.startsWith("@/modules/")&&!spec.startsWith("./")&&!spec.startsWith("../"))
   throw Error("External runtime dependency in domain: "+spec);
  const resolved=spec.startsWith("@/")?spec.slice(2):posix.normalize(posix.join(posix.dirname(path),spec));
  const moduleURL=await loadDomain(resolved+".ts");
  javascript=javascript.replace(match[0],"from "+JSON.stringify(moduleURL));
 }
 const url="data:text/javascript;base64,"+Buffer.from(javascript).toString("base64");
 cache.set(path,url);
 return url;
}
const {createConsignmentService}=await import(await loadDomain("modules/consignment/service.ts"));
const {createOrderService}=await import(await loadDomain("modules/orders/service.ts"));
const {createInventoryService}=await import(await loadDomain("modules/inventory/service.ts"));
const {createReviewService}=await import(await loadDomain("modules/consignment/review-service.ts"));

test("consignment service preserves public success response and limits repository writes",async()=>{
 const writes=[];
 const ownerRequests=[{id:"c1",status:"submitted"}],adminRequests=[{id:"c1",status:"submitted",deposant:"owner"}];
 const repository={
  listForOwner:async id=>{assert.equal(id,"owner");return ownerRequests},
  listForAdmin:async()=>adminRequests,
  create:async draft=>{writes.push(draft);return {id:"created-1",status:"submitted"}},
  withdraw:async(id,ownerId)=>id==="c1"&&ownerId==="owner"?{id,status:"withdrawn"}:null
 };
 const service=createConsignmentService(repository);
 assert.deepEqual(await service.listForOwner("owner"),ownerRequests);
 assert.deepEqual(await service.listForAdmin(),adminRequests);
 const valid={title:"Veste test",brand:"Test",category:"vestes",condition:"good",
  notes:"Essai",estimatedPriceCents:3500};
 assert.deepEqual(await service.create("owner",valid),{ok:true,value:{id:"created-1",status:"submitted"}});
 assert.deepEqual(writes,[{ownerId:"owner",title:"Veste test",brand:"Test",category:"vestes",
  condition:"good",notes:"Essai",estimatedPriceCents:3500}]);
 for(const changed of [{...valid,title:"abc"},{...valid,condition:"unknown"},{...valid,estimatedPriceCents:-1},
   {...valid,estimatedPriceCents:1.5},{...valid,estimatedPriceCents:10000001}]){
  const result=await service.create("owner",changed);
  assert.deepEqual(result,{ok:false,status:400,error:"Informations invalides"});
 }
 assert.equal(writes.length,1,"Invalid request must not reach database");
 assert.deepEqual(await service.withdraw("c1","owner"),{ok:true,value:{id:"c1",status:"withdrawn"}});
 assert.deepEqual(await service.withdraw("c1","other"),{
  ok:false,status:409,error:"Demande introuvable ou déjà en cours de traitement"});
});
test("orders preserve SKU rule, disabled-payment semantics and legacy response keys",async()=>{
 const writes=[];
 const repo={
  listForBuyer:async id=>[{id:"o1",buyer:id,shipment_status:null}],
  listForAdmin:async()=>[{id:"o1",buyer:"owner",shipping_status:null}],
  request:async(buyerId,sku)=>{writes.push({buyerId,sku});return {id:"o2",status:"requested"}},
  cancel:async(id,buyerId)=>id==="o2"&&buyerId==="owner"?{id,status:"cancelled"}:null
 };
 const service=createOrderService(repo);
 assert.deepEqual(await service.listForBuyer("owner"),[{id:"o1",buyer:"owner",shipment_status:null}]);
 assert.deepEqual(await service.listForAdmin(),[{id:"o1",buyer:"owner",shipping_status:null}]);
 for(const sku of ["rf-0000001","RF-1","RF-00000001","RF-000000a","unknown"]){
  assert.deepEqual(await service.request("owner",sku),{ok:false,status:400,error:"Référence invalide"});
 }
 assert.equal(writes.length,0);
 assert.deepEqual(await service.request("owner","RF-0000001"),{ok:true,value:{id:"o2",status:"requested"}});
 assert.deepEqual(writes,[{buyerId:"owner",sku:"RF-0000001"}]);
 assert.deepEqual(await service.cancel("o2","owner"),{ok:true,value:{id:"o2",status:"cancelled"}});
 assert.deepEqual(await service.cancel("o2","other"),{ok:false,status:409,error:"Annulation impossible"});
});
test("inventory transition service is atomic and denies forbidden transitions",async()=>{
 let state="listed",movements=0,transactions=0;
 const unit={
  async transaction(fn){
   transactions++;
   return fn({
    lockState:async()=>state,
    changeState:async(_,target)=>{state=target},
    appendMovement:async()=>{movements++}
   });
  }
 };
 const service=createInventoryService(unit);
 const command={itemId:"item",actorId:"admin",target:"reserved",location:"A-1"};
 assert.deepEqual(await service.changeState(command),{ok:true,value:{state:"reserved"}});
 assert.equal(state,"reserved");assert.equal(movements,1);
 assert.deepEqual(await service.changeState({...command,target:"sold"}),
  {ok:false,status:409,error:"Transition impossible"});
 assert.equal(state,"reserved");assert.equal(movements,1);
 assert.deepEqual(await service.changeState({...command,target:"listed"}),
  {ok:true,value:{state:"listed"}});
 assert.equal(state,"listed");assert.equal(movements,2);
 assert.equal(transactions,3);
 const missing=createInventoryService({transaction:async fn=>fn({
  lockState:async()=>null,
  changeState:async()=>assert.fail("missing item updated"),
  appendMovement:async()=>assert.fail("missing item logged")
 })});
 assert.deepEqual(await missing.changeState(command),{ok:false,status:404,error:"Article introuvable"});
});
test("transaction exceptions propagate, never return a false success",async()=>{
 const service=createInventoryService({transaction:async fn=>fn({
  lockState:async()=> "listed",
  changeState:async()=>{throw Error("postgres unavailable")},
  appendMovement:async()=>assert.fail("should not append")
 })});
 await assert.rejects(service.changeState({itemId:"id",actorId:"admin",target:"reserved",location:"A"}),/postgres unavailable/);
});

test("administrative review keeps statuses, validation and inventory creation atomic",async()=>{
 let current="submitted",skuCreated=0;
 const changes=[],actions=[];
 const unit={
  transaction:async fn=>{
   actions.push("begin");
   const result=await fn({
    lock:async id=>id==="request"?
      {id,status:current,estimatedPriceCents:3500}:null,
    setStatus:async(id,status)=>{changes.push({id,status});current=status},
    createInventory:async(id,actorId,priceCents,commissionBps)=>{
     skuCreated++;assert.equal(id,"request");assert.equal(actorId,"admin");
     assert.equal(priceCents,3500);assert.equal(commissionBps,3500);
    }
   });
   actions.push("commit");
   return result;
  }
 };
 const service=createReviewService(unit);
 assert.deepEqual(await service.transition({id:"request",actorId:"admin",action:"invalid",commissionBps:0}),
  {ok:false,status:400,error:"Action invalide"});
 assert.equal(actions.length,0,"Invalid review action must not access DB");
 assert.deepEqual(await service.transition({id:"missing",actorId:"admin",action:"review"}),
  {ok:false,status:404,error:"Demande introuvable"});
 assert.deepEqual(await service.transition({id:"request",actorId:"admin",action:"accept",commissionBps:3500}),
  {ok:false,status:409,error:"Transition interdite"});
 assert.deepEqual(await service.transition({id:"request",actorId:"admin",action:"review"}),
  {ok:true,value:{id:"request",status:"reviewing"}});
 assert.deepEqual(await service.transition({id:"request",actorId:"admin",action:"accept",commissionBps:10001}),
  {ok:false,status:400,error:"Commission invalide"});
 assert.equal(current,"reviewing");assert.equal(skuCreated,0);
 assert.deepEqual(await service.transition({id:"request",actorId:"admin",action:"accept",commissionBps:3500}),
  {ok:true,value:{id:"request",status:"accepted"}});
 assert.equal(skuCreated,1);
 assert.deepEqual(await service.transition({id:"request",actorId:"admin",action:"decline"}),
  {ok:false,status:409,error:"Transition interdite"});
 assert.deepEqual(changes.map(x=>x.status),["reviewing","accepted"]);
 assert.equal(actions.filter(x=>x==="begin").length,actions.filter(x=>x==="commit").length);
});
