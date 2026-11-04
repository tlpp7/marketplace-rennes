import test from "node:test";
import assert from "node:assert/strict";
import {request,cookie} from "./helpers.mjs";

test("P0 anonymous private endpoints return 401",async()=>{
 for(const path of ["/api/me","/api/profile","/api/follows","/api/conversations","/api/appointments","/api/consignments","/api/orders"]){
  const r=await request(path);
  assert.equal(r.status,401,`${path}: expected 401, got ${r.status}`);
 }
});
test("P0 anonymous admin endpoints return 403",async()=>{
 for(const path of ["/api/admin/profiles","/api/admin/reviews","/api/admin/consignments","/api/admin/inventory","/api/admin/orders"]){
  const r=await request(path);
  assert.equal(r.status,403,`${path}: expected 403, got ${r.status}`);
 }
});
test("P0 foreign-origin writes rejected",async()=>{
 const r=await request("/api/consignments",{method:"POST",foreignOrigin:true,body:{title:"Test invalide"}});
 assert.equal(r.status,403);
});
test("P0 authenticated session", {skip:!cookie},async()=>{
 const r=await request("/api/me",{session:cookie});
 assert.equal(r.status,200);
 assert.ok(r.data?.user);
});
test("P0 member cannot access admin", {skip:!cookie},async()=>{
 for(const path of ["/api/admin/profiles","/api/admin/inventory"]){
  const r=await request(path,{session:cookie});
  assert.equal(r.status,403);
 }
});
test("P0 message access regression", {skip:!(process.env.RF_TEST_CONVERSATION_ID&&process.env.RF_TEST_COOKIE_A&&process.env.RF_TEST_COOKIE_B&&process.env.RF_TEST_COOKIE_C)},async()=>{
 const id=process.env.RF_TEST_CONVERSATION_ID;
 assert.match(id,/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
 const get=(session,conversation=id)=>request("/api/messages?conversationId="+encodeURIComponent(conversation),{session});
 for(const c of [process.env.RF_TEST_COOKIE_A,process.env.RF_TEST_COOKIE_B]){
  const r=await get(c);assert.equal(r.status,200);assert.ok(Array.isArray(r.data?.messages));
 }
 const outsider=await get(process.env.RF_TEST_COOKIE_C);
 const missing=await get(process.env.RF_TEST_COOKIE_C,"00000000-0000-4000-8000-000000000000");
 assert.equal(outsider.status,404);assert.equal(missing.status,404);
 assert.deepEqual(outsider.data,missing.data);
 assert.equal((await get("")).status,401);
 assert.equal((await get(process.env.RF_TEST_COOKIE_A,"not-a-uuid")).status,400);
});
