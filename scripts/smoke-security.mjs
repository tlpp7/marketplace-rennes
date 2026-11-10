import assert from "node:assert/strict";

// Run only against a local development server, never an external deployment.
const url=new URL(process.env.RF_SECURITY_TEST_BASE??"http://127.0.0.1:3000");
if(!["localhost","127.0.0.1","[::1]"].includes(url.hostname))throw Error("Security smoke test must target localhost");
const origin=url.origin;
const check=async (path,options={})=>fetch(new URL(path,url),{redirect:"manual",...options});

const live=await check("/api/health/live/");
assert.equal(live.status,200);
assert.equal((await live.json()).status,"alive");
assert.match(live.headers.get("cache-control")??"",/no-store/i);
assert.equal(live.headers.get("x-frame-options"),"DENY");
assert.equal(live.headers.get("x-content-type-options"),"nosniff");
assert.equal(live.headers.get("referrer-policy"),"no-referrer");

const ready=await check("/api/health/");
assert.equal(ready.status,200,"PostgreSQL readiness failed");
assert.equal((await ready.json()).status,"ok");
assert.match(ready.headers.get("cache-control")??"",/no-store/i);

for(const foreign of ["https://attacker.example","null","not-an-origin"]){
 const response=await check("/api/auth/login/",{method:"POST",headers:{"Content-Type":"application/json",Origin:foreign},body:"{}"});
 assert.equal(response.status,403,"Unexpected acceptance of invalid Origin: "+foreign);
}
// Test body limit even when Content-Length is unavailable to the application.
const oversized=await check("/api/auth/login/",{method:"POST",headers:{"Content-Type":"application/json",Origin:origin},body:JSON.stringify({email:"x@example.com",password:"A".repeat(17000)})});
assert.ok(oversized.status>=400,"Oversized JSON must not be accepted");

console.log("Security smoke OK: headers, readiness, liveness, origins and body limit.");
