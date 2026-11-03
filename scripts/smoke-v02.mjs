import assert from "node:assert/strict";
import pg from "pg";
import {randomBytes} from "node:crypto";
import {mkdir,writeFile,unlink} from "node:fs/promises";
import {join} from "node:path";
if(process.env.RF_V02_TEST_MODE!=="true")throw Error("RF_V02_TEST_MODE=true requis sur une base de test isolée");
if(!process.env.DATABASE_URL)throw Error("DATABASE_URL requis");
const origin=process.env.RF_V02_TEST_BASE??"http://127.0.0.1:3000";
const host=new URL(origin).hostname;
if(!["localhost","127.0.0.1","[::1]"].includes(host))throw Error("Ce test exige un serveur local");
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
const suffix=randomBytes(5).toString("hex");
let requestId=null,itemId=null;
const fixturePath=join(process.cwd(),"public","consignments","test-ci-"+suffix+".png");
async function request(path,{method="GET",body,cookie,foreignOrigin=false}={}){
 const headers={};
 if(cookie)headers.Cookie=cookie;
 if(body!==undefined){headers["Content-Type"]="application/json";headers.Origin=foreignOrigin?"https://attacker.example":origin}
 const r=await fetch(origin+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 let data;try{data=await r.json()}catch{data={}};
 return {status:r.status,data,cookie:r.headers.get("set-cookie")?.split(";")[0]};
}
async function registration(prefix){
 const handle=prefix+"_"+suffix;
 const r=await request("/api/auth/register/",{method:"POST",body:{handle,email:handle+"@example.invalid",password:"TestPassword_123456"}});
 assert.equal(r.status,200,"registration: "+JSON.stringify(r.data));
 assert.ok(r.cookie,"Missing session cookie");
 const me=await request("/api/me/",{cookie:r.cookie});
 assert.equal(me.status,200);

 return {cookie:r.cookie,handle,id:me.data.user.id};
}
await client.connect();
try{
 const databaseName=(await client.query("SELECT current_database() AS name")).rows[0].name;
 if(!/test/i.test(databaseName))throw Error("Ce smoke test exige une base isolée dont le nom contient test");
 await mkdir(join(process.cwd(),"public","consignments"),{recursive:true});
 await writeFile(fixturePath,Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8//8/AwMDEwMDAwMDAwAkBgMB/DXemwAAAABJRU5ErkJggg==","base64"));
 const member=await registration("v02seller");
 const admin=await registration("v02admin");
 await client.query("INSERT INTO platform_admins(user_id) VALUES($1)",[admin.id]);
 const created=await request("/api/consignments/",{method:"POST",cookie:member.cookie,body:{title:"Veste test pour circuit V02",brand:"Exemple",category:"vestes",condition:"good",notes:"Article de test isolé",estimatedPriceCents:3500}});
 assert.equal(created.status,201,"consignment request: "+JSON.stringify(created.data));
 requestId=created.data.request.id;
 for(const action of ["review","accept"]){
  const response=await request("/api/admin/consignments/"+requestId+"/",{method:"PATCH",cookie:admin.cookie,body:{action,commissionBps:3500}});
  assert.equal(response.status,200,"admin "+action+": "+JSON.stringify(response.data));
 }
 const inventory=await request("/api/admin/inventory/",{cookie:admin.cookie});
 assert.equal(inventory.status,200);
 const item=inventory.data.items.find(v=>v.title==="Veste test pour circuit V02"&&v.deposant===member.handle);
 assert.ok(item?.id,"Accepted item missing from inventory");
 itemId=item.id;
 const denied=await request("/api/admin/inventory/"+itemId+"/operations/",{method:"POST",cookie:admin.cookie,body:{action:"receive",physicallyReceived:true,proofReference:"TEST-RECEPTION",location:"ETAGE-1"}});
 assert.equal(denied.status,409,"Receipt must require a mandate");
 const mandate=await request("/api/consignments/"+requestId+"/mandate/",{cookie:member.cookie});
 assert.equal(mandate.status,200,"mandate preview: "+JSON.stringify(mandate.data));
 assert.equal(mandate.data.accepted,false);
 const accepted=await request("/api/consignments/"+requestId+"/mandate/",{method:"POST",cookie:member.cookie,body:{accept:true,depositorName:"Déposant de test",depositorAddress:"15 rue du test, Rennes",version:mandate.data.version,previewSha256:mandate.data.previewSha256,priceCents:mandate.data.priceCents,commissionBps:mandate.data.commissionBps}});
 assert.equal(accepted.status,201,"mandate acceptance: "+JSON.stringify(accepted.data));
 assert.match(accepted.data.sha256,/^[a-f0-9]{64}$/);
 const receipt=await request("/api/admin/inventory/"+itemId+"/operations/",{method:"POST",cookie:admin.cookie,body:{action:"receive",physicallyReceived:true,proofReference:"TEST-RECEPTION",location:"ETAGE-1",notes:"Remise en mains propres pour le test"}});
 assert.equal(receipt.status,200,"receipt: "+JSON.stringify(receipt.data));
 assert.equal(receipt.data.state,"quality_check");
 const premature=await request("/api/admin/inventory/"+itemId+"/",{method:"PATCH",cookie:admin.cookie,body:{state:"ready",location:"ETAGE-1"}});
 assert.equal(premature.status,409,"Quality bypass must fail");
 const quality=await request("/api/admin/inventory/"+itemId+"/operations/",{method:"POST",cookie:admin.cookie,body:{action:"quality",verdict:"passed",notes:"Test OK",checks:{labelMatches:true,clean:true,conditionMatches:true,photoVerified:true}}});
 assert.equal(quality.status,200,"quality: "+JSON.stringify(quality.data));
 const prematurePublication=await request("/api/admin/inventory/"+itemId+"/",{method:"PATCH",cookie:admin.cookie,body:{state:"listed",location:"ETAGE-1"}});
 assert.equal(prematurePublication.status,409,"Publication bypass must fail");
 const publication=await request("/api/admin/inventory/"+itemId+"/operations/",{method:"POST",cookie:admin.cookie,body:{action:"publish",size:"M",photoUrl:"/consignments/test-ci-"+suffix+".png",description:"Article fictif de test, jamais destiné à la vente réelle."}});
 assert.equal(publication.status,200,"publication: "+JSON.stringify(publication.data));
 const catalog=await request("/catalogue/");
 assert.equal(catalog.status,200,"Public catalogue should be reachable");
 const sku=item.sku;
 const detail=await fetch(origin+"/produit/"+sku.toLowerCase()+"/");
 assert.equal(detail.status,200,"Public product detail should be reachable");
 const owner=await request("/api/consignments/",{cookie:member.cookie});
 const own=owner.data.requests.find(v=>v.id===requestId);
 assert.equal(own.mandate_accepted,true);
 assert.equal(own.quality_verdict,"passed");
 assert.match(own.receipt_sha256,/^[a-f0-9]{64}$/);
 console.log("V0.2 PASS : demande, mandat, réception, qualité, publication et accès propriétaire");
}finally{
 // Proof documents are intentionally immutable. This test only runs against
 // an isolated database: keep the synthetic rows and dispose of that database.
 await unlink(fixturePath).catch(()=>{});
 await client.end();
}
