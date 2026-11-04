import test from "node:test";
import assert from "node:assert/strict";
import {request,cookie} from "./helpers.mjs";

test("P1 authenticated consignment listing",{skip:!cookie},async()=>{
 const r=await request("/api/consignments",{session:cookie});
 assert.equal(r.status,200);assert.ok(Array.isArray(r.data?.requests));
});
test("P1 authenticated order listing",{skip:!cookie},async()=>{
 const r=await request("/api/orders",{session:cookie});
 assert.equal(r.status,200);assert.ok(Array.isArray(r.data?.orders));
});
test("P1 invalid consignment rejected without insertion",{skip:!cookie},async()=>{
 const r=await request("/api/consignments",{method:"POST",session:cookie,body:{title:"x",category:"vestes",condition:"good",estimatedPriceCents:-1}});
 assert.equal(r.status,400);
});
test("P1 invalid order SKU rejected when ordering enabled",{skip:!(cookie&&process.env.RF_TEST_ORDERS_ENABLED==="true")},async()=>{
 const r=await request("/api/orders",{method:"POST",session:cookie,body:{sku:"INVALID"}});
 assert.equal(r.status,400);
});
test("P1 inventory access restricted to admin",{skip:!cookie},async()=>{
 const r=await request("/api/admin/inventory",{session:cookie});
 assert.equal(r.status,403);
});
