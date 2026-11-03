import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomBytes} from "node:crypto";
import pg from "pg";
test("V0.2 : contraintes de workflow en PostgreSQL (transaction annulée)",async()=>{
 if(process.env.RF_V02_TEST_MODE!=="true")throw Error("Refus de modifier la base : définir RF_V02_TEST_MODE=true uniquement sur une base de test isolée");
 if(!process.env.DATABASE_URL)throw Error("DATABASE_URL requis");
 const client=new pg.Client({connectionString:process.env.DATABASE_URL});
 await client.connect();
 try{
  await client.query("BEGIN");
  const token=randomBytes(6).toString("hex");
  const user=(await client.query("INSERT INTO users(handle,email,password_hash) VALUES($1,$2,$3) RETURNING id",["v02_"+token,"v02_"+token+"@example.invalid","test-not-a-real-password"])).rows[0];
  const request=(await client.query("INSERT INTO consignment_requests(owner_id,title,category,brand,condition_label,estimated_price_cents,status) VALUES($1,$2,$3,$4,$5,$6,'accepted') RETURNING id",[user.id,"Veste test V02","vestes","Exemple","good",3500])).rows[0];
  const sku="RF-"+String((await client.query("SELECT nextval('rennfripes_sku_seq') AS n")).rows[0].n).padStart(7,"0");
  const item=(await client.query("INSERT INTO consignment_inventory(request_id,sku,list_price_cents,commission_bps) VALUES($1,$2,$3,$4) RETURNING id",[request.id,sku,3500,3500])).rows[0];
  async function denied(sqlText){
   await client.query("SAVEPOINT v02_denial");
   try{await assert.rejects(client.query(sqlText,[item.id]),/./)}finally{
    await client.query("ROLLBACK TO SAVEPOINT v02_denial");
    await client.query("RELEASE SAVEPOINT v02_denial");
   }
  }
  await denied("UPDATE consignment_inventory SET state='quality_check' WHERE id=$1");
  await denied("UPDATE consignment_inventory SET state='listed' WHERE id=$1");
  const receipt="Renn'Fripes : attestation de réception "+sku;
  const hash=createHash("sha256").update(receipt).digest("hex");
  await client.query("INSERT INTO consignment_receipts(item_id,receiver_id,proof_reference,location_code,receipt_document,receipt_sha256) VALUES($1,$2,$3,$4,$5,$6)",[item.id,user.id,"TEST-REC-001","ETAGERE-1",receipt,hash]);
  await denied("UPDATE consignment_inventory SET state='quality_check' WHERE id=$1");
  await client.query("INSERT INTO consignment_mandates(item_id,owner_id,depositor_name,depositor_address,terms_version,document_text,document_sha256) VALUES($1,$2,$3,$4,$5,$6,$7)",[item.id,user.id,"Test Déposant","Rue de la Test, Rennes","v02-test","Mandat de test","a".repeat(64)]);
  await client.query("UPDATE consignment_inventory SET state='quality_check' WHERE id=$1",[item.id]);
  await denied("UPDATE consignment_inventory SET state='ready' WHERE id=$1");
  const checks={labelMatches:true,clean:true,conditionMatches:true,photoVerified:true};
  await client.query("INSERT INTO consignment_quality_reports(item_id,inspector_id,verdict,checks) VALUES($1,$2,'passed',$3::jsonb)",[item.id,user.id,JSON.stringify(checks)]);
  await client.query("UPDATE consignment_inventory SET state='ready' WHERE id=$1",[item.id]);
  await denied("UPDATE consignment_inventory SET state='listed' WHERE id=$1");
  await denied("UPDATE consignment_inventory SET state='listed' WHERE id=$1");
  await client.query("INSERT INTO consignment_publications(item_id,publisher_id,size_label,photo_url,public_description) VALUES($1,$2,$3,$4,$5)",[item.id,user.id,"M","/consignments/test.jpg","Description publique de la veste de test."]);
  await client.query("UPDATE consignment_inventory SET state='listed' WHERE id=$1",[item.id]);
  const found=await client.query("SELECT state FROM consignment_inventory WHERE id=$1",[item.id]);
  assert.equal(found.rows[0].state,"listed");
  await client.query("ROLLBACK");
 }catch(e){await client.query("ROLLBACK").catch(()=>{});throw e}
 finally{await client.end()}
});
