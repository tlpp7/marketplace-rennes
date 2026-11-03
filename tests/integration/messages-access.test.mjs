import test from "node:test";
import assert from "node:assert/strict";

// Run against an isolated test instance with three pre-existing test accounts.
// Example:
// RF_TEST_BASE=http://127.0.0.1:3100 RF_TEST_CONVERSATION_ID=<uuid> \
// RF_TEST_COOKIE_A='rf_session=...' RF_TEST_COOKIE_B='rf_session=...' \
// RF_TEST_COOKIE_C='rf_session=...' node --test tests/integration/messages-access.test.mjs
const base=process.env.RF_TEST_BASE;
const id=process.env.RF_TEST_CONVERSATION_ID;
const a=process.env.RF_TEST_COOKIE_A;
const b=process.env.RF_TEST_COOKIE_B;
const c=process.env.RF_TEST_COOKIE_C;
const ready=Boolean(base&&id&&a&&b&&c);
const uuid=/^[0-9a-f-]{36}$/i;

test("V0.3 message access: members allowed, outsider denied", {skip:!ready}, async()=>{
 assert.match(id,uuid);
 const url=new URL(base);
 assert.ok(["127.0.0.1","localhost","[::1]"].includes(url.hostname),"Only run against local test server");
 async function get(conversationId,cookie){
  const response=await fetch(new URL("/api/messages/?conversationId="+encodeURIComponent(conversationId),url),{
   headers:cookie?{Cookie:cookie}:{},redirect:"manual"
  });
  return {status:response.status,data:await response.json()};
 }
 for(const cookie of [a,b]){
  const result=await get(id,cookie);
  assert.equal(result.status,200);
  assert.ok(Array.isArray(result.data.messages));
 }
 const outsider=await get(id,c);
 assert.equal(outsider.status,404);
 const missing=await get("00000000-0000-4000-8000-000000000000",c);
 assert.equal(missing.status,404);
 assert.deepEqual(outsider.data,missing.data,"Do not reveal whether a private conversation exists");
 const anonymous=await get(id);
 assert.equal(anonymous.status,401);
 const malformed=await get("not-a-uuid",a);
 assert.equal(malformed.status,400);
});
