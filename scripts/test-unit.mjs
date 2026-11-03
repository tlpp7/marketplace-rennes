import assert from "node:assert/strict";import {test} from "node:test";
import fs from "node:fs";
test("required migrations and route protections",()=>{
 const sql=fs.readFileSync("infra/sql/001_social.sql","utf8");
 assert.match(sql,/CREATE TABLE IF NOT EXISTS sessions/);
 for(const file of ["app/api/messages/route.ts","app/api/appointments/route.ts","app/api/admin/profiles/[id]/route.ts"]){
  const content=fs.readFileSync(file,"utf8");
  assert.match(content,/currentUser|currentAdmin/);
 }
});
test("payment routes remain disabled by default",()=>{
 const content=fs.readFileSync("app/api/orders/route.ts","utf8");
 assert.match(content,/ORDERS_ENABLED/);
});

test("V0.2 requires reception, quality, mandate and publication",()=>{
 const migration=fs.readFileSync("infra/sql/006_v02_operations.sql","utf8");
 for(const name of ["consignment_receipts","consignment_quality_reports","consignment_mandates","consignment_publications","enforce_consignment_workflow"]){
  assert.match(migration,new RegExp(name));
 }
 const legacy=fs.readFileSync("app/api/admin/inventory/[id]/route.ts","utf8");
 assert.doesNotMatch(legacy,/intake:\s*\["quality_check"\]/);
 assert.doesNotMatch(legacy,/ready:\s*\["listed"/);
 const operations=fs.readFileSync("app/api/admin/inventory/[id]/operations/route.ts","utf8");
 assert.match(operations,/currentAdmin/);
 assert.match(operations,/trustedRequest/);
 assert.match(operations,/mandate/);
 const catalog=fs.readFileSync("modules/catalog/live.ts","utf8");
 assert.match(catalog,/i\.state='listed'/);
 assert.match(catalog,/consignment_mandates/);
});
