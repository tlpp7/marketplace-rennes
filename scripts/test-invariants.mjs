import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import ts from "typescript";

/** Load pure TypeScript modules without a server or a new runtime dependency. */
async function pure(path){
 const source=await readFile(new URL("../"+path,import.meta.url),"utf8");
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 return import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
}
const {calculateConsignment}=await pure("modules/consignment/finance.ts");
const {calculateViability}=await pure("modules/economics/viability.ts");
const {INVENTORY_STATES,allowedAdminTransition,allowedWorkflowAction,hasPublicationEvidence,canShowInCatalog}=await pure("modules/inventory/state-machine.ts");
const {isTrustedOrigin}=await pure("lib/security/origin-policy.ts");
const {evidenceSha256,verifyEvidenceSha256}=await pure("lib/crypto/evidence.ts");

// Reproducible property-based testing: the seed is fixed and logged on failure.
function rng(seed=0x5172A11){
 let x=seed>>>0;
 return ()=>{
  x^=x<<13;x^=x>>>17;x^=x<<5;
  return (x>>>0)/0x100000000;
 };
}
function int(rand,max){return Math.floor(rand()*(max+1))}
function runCases(name,count,fn){
 const random=rng();
 for(let index=0;index<count;index++){
  try{fn(random,index)}
  catch(error){
   throw Error(name+" failed at seed=0x5172A11 case="+index+": "+(error instanceof Error?error.message:String(error)),{cause:error});
  }
 }
}
const MAX=Number.MAX_SAFE_INTEGER;
function expectedCommission(price,bps){return Number((BigInt(price)*BigInt(bps)+5000n)/10000n)}

test("economic allocation conserves the sale price — 12,000 generated cases",()=>{
 runCases("allocation",12000,random=>{
  const price=int(random,1_000_000_000);
  const bps=int(random,10000);
  const fees=int(random,1_000_000);
  const r=calculateConsignment(price,bps,fees);
  assert.equal(r.commissionCents,expectedCommission(price,bps));
  assert.equal(r.priceCents,r.commissionCents+r.payoutCents);
  assert.equal(r.contributionCents,r.commissionCents-fees);
  assert.ok(r.commissionCents>=0&&r.commissionCents<=price);
  assert.ok(r.payoutCents>=0&&Number.isSafeInteger(r.payoutCents));
 });
});
test("commission is monotonic, exactly rounded and safe at numeric boundaries",()=>{
 for(const price of [0,1,2,99,100,101,9999,MAX-1,MAX]){
  for(const bps of [0,1,5000,9999,10000]){
   const r=calculateConsignment(price,bps,MAX);
   assert.equal(r.commissionCents,expectedCommission(price,bps));
   assert.equal(r.commissionCents+r.payoutCents,price);
   assert.ok(Number.isSafeInteger(r.contributionCents));
  }
 }
 runCases("monotone",4000,random=>{
  const lower=int(random,500_000_000),upper=lower+int(random,100_000);
  const bps=int(random,10000);
  assert.ok(calculateConsignment(upper,bps).commissionCents>=calculateConsignment(lower,bps).commissionCents);
 });
});
test("invalid monetary representations are rejected rather than rounded silently",()=>{
 for(const invalid of [-1,0.1,Number.POSITIVE_INFINITY,Number.NaN,MAX+1]){
  assert.throws(()=>calculateConsignment(invalid,3000));
  assert.throws(()=>calculateConsignment(2000,3000,invalid));
 }
 for(const bps of [-1,0.5,10001,Number.NaN,Infinity])assert.throws(()=>calculateConsignment(1000,bps));
});
test("unit economics is affine in paid sales, break-even is minimal — 6,000 cases",()=>{
 runCases("viability",6000,random=>{
  const args={averageSaleCents:int(random,100_000),commissionBps:int(random,10000),
   processingCents:int(random,1500),handlingCents:int(random,5000),
   incidentProvisionCents:int(random,1500),fixedMonthlyCents:int(random,1_000_000),
   paidSales:int(random,1000)};
  const r=calculateViability(args);
  assert.equal(r.commissionPerSaleCents,expectedCommission(args.averageSaleCents,args.commissionBps));
  assert.equal(r.monthlyResultCents,
   r.contributionPerSaleCents*args.paidSales-args.fixedMonthlyCents);
  const next=calculateViability({...args,paidSales:args.paidSales+1});
  assert.equal(next.monthlyResultCents-r.monthlyResultCents,r.contributionPerSaleCents);
  if(r.breakEvenOrders!==null){
   const at=calculateViability({...args,paidSales:r.breakEvenOrders}).monthlyResultCents;
   assert.ok(at>=0,"break-even is not profitable");
   if(r.breakEvenOrders>0)assert.ok(calculateViability({...args,paidSales:r.breakEvenOrders-1}).monthlyResultCents<0,"break-even not minimal");
  }else{
   assert.ok(r.contributionPerSaleCents<=0&&args.fixedMonthlyCents>0);
  }
 });
});
test("viability rejects invalid inputs and unsafe numeric overflow",()=>{
 const valid={averageSaleCents:4000,commissionBps:3500,processingCents:80,handlingCents:300,
  incidentProvisionCents:120,fixedMonthlyCents:90000,paidSales:100};
 assert.equal(calculateViability(valid).contributionPerSaleCents,900);
 for(const name of Object.keys(valid)){
  for(const value of [-1,0.1,Infinity,NaN])assert.throws(()=>calculateViability({...valid,[name]:value}));
 }
 assert.throws(()=>calculateViability({...valid,commissionBps:10001}));
 assert.throws(()=>calculateViability({...valid,averageSaleCents:MAX,commissionBps:10000,paidSales:MAX}));
});
test("inventory transitions: only allowed admin edges, no unpaid sale or terminal escape",()=>{
 const allowed=new Set(["ready:returned","listed:reserved","listed:returned","reserved:listed"]);
 for(const from of [...INVENTORY_STATES,"unexpected"]){
  for(const to of [...INVENTORY_STATES,"unexpected"]){
   assert.equal(allowedAdminTransition(from,to),allowed.has(from+":"+to),from+" => "+to);
   assert.equal(to==="sold"&&allowedAdminTransition(from,to),false);
  }
 }
 for(const from of ["sold","returned"])for(const to of INVENTORY_STATES)
  assert.equal(allowedAdminTransition(from,to),false);
 assert.equal(allowedWorkflowAction("receive","intake"),true);
 assert.equal(allowedWorkflowAction("quality","quality_check"),true);
 assert.equal(allowedWorkflowAction("publish","ready"),true);
 assert.equal(allowedWorkflowAction("__proto__","ready"),false);
});
test("catalog visibility requires listed state and all unique evidence — 4,000 cases",()=>{
 runCases("evidence",4000,random=>{
  const evidence={receiptCount:int(random,3),positiveQualityCount:int(random,3),mandateCount:int(random,3)};
  const publications=int(random,3),state=INVENTORY_STATES[int(random,INVENTORY_STATES.length-1)];
  const expected=evidence.receiptCount===1&&evidence.positiveQualityCount===1&&evidence.mandateCount===1;
  assert.equal(hasPublicationEvidence(evidence),expected);
  assert.equal(canShowInCatalog(state,evidence,publications),state==="listed"&&expected&&publications===1);
 });
 assert.equal(hasPublicationEvidence({receiptCount:NaN,positiveQualityCount:1,mandateCount:1}),false);
});
test("CSRF origin rejects arbitrary domains, credentials, paths and malformed values",()=>{
 const expected="https://rennfripes.example",request="https://internal.railway.app/api/consignments/";
 for(const raw of [null,"null","not-a-url","https://attacker.example","http://rennfripes.example",
  "https://rennfripes.example.evil.test","https://user:pass@rennfripes.example","https://rennfripes.example/path",
  "https://rennfripes.example?x=1","https://rennfripes.example#fragment"]){
  assert.equal(isTrustedOrigin(raw,expected,request,true),false,String(raw));
 }
 assert.equal(isTrustedOrigin(expected,expected,request,true),true);
 assert.equal(isTrustedOrigin(expected,undefined,request,true),false,"fail closed in production");
 assert.equal(isTrustedOrigin("http://localhost:3000",undefined,"http://127.0.0.1:3000/api/orders",false),true);
 assert.equal(isTrustedOrigin("http://localhost:3001",undefined,"http://127.0.0.1:3000/api/orders",false),false);
 runCases("forged domains",3000,random=>{
  const host="a"+int(random,1000000)+".evil.test";
  assert.equal(isTrustedOrigin("https://"+host,expected,request,true),false);
 });
});
test("SHA-256 fingerprints detect content changes and reject malformed hashes",()=>{
 runCases("sha256",1500,(random,index)=>{
  const value="RENN-FRIPES:"+index+":"+int(random,2_000_000_000);
  const digest=evidenceSha256(value);
  assert.equal(digest,createHash("sha256").update(value,"utf8").digest("hex"));
  assert.equal(verifyEvidenceSha256(value,digest),true);
  assert.equal(verifyEvidenceSha256(value+"!",digest),false);
  assert.equal(verifyEvidenceSha256(value,digest.slice(0,63)),false);
 });
});
