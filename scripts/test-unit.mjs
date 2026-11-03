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
