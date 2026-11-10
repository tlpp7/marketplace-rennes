import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync,existsSync} from "node:fs";
import {execFileSync} from "node:child_process";

const read=path=>readFileSync(path,"utf8");

test("no local credentials or private keys tracked in Git",()=>{
 const tracked=execFileSync("git",["ls-files","-z"],{encoding:"utf8"}).split("\0").filter(Boolean);
 const forbidden=tracked.filter(path=>{
  const name=path.split("/").at(-1);
  if(name===".env.example")return false;
  return /^\.env(\.|$)/.test(name)||/^(id_rsa|id_ed25519|private_key|\.npmrc)$/i.test(name)||/\.(p12|pfx|key|pem)$/i.test(name);
 });
 assert.deepEqual(forbidden,[],"Unexpected secret-bearing tracked paths");
});

test("production build and dependency manifest are reproducible",()=>{
 const pkg=JSON.parse(read("package.json")),lock=JSON.parse(read("package-lock.json"));
 assert.equal(pkg.private,true);
 assert.equal(lock.packages[""].name,pkg.name);
 assert.equal(lock.packages[""].version,pkg.version);
 assert.ok(pkg.scripts.build&&pkg.scripts.lint&&pkg.scripts["test:config"]);
 for(const workflow of [".github/workflows/ci.yml",".github/workflows/quality-gates.yml"]){
  const y=read(workflow);
  assert.match(y,/npm ci/);
  assert.doesNotMatch(y,/run: npm install(?:\s|$)/);
  assert.match(y,/contents: read/);
 }
});

test("SQL migrations are sequential, tracked, and not silently omitted",()=>{
 const files=readdirSync("infra/sql").filter(n=>/^\d{3}_.+\.sql$/.test(n)).sort();
 assert.ok(files.length>=7);
 for(let i=0;i<files.length;i++)assert.equal(Number(files[i].slice(0,3)),i+1);
 const staging=read("scripts/migrate-staging.mjs");
 for(const migration of files)assert.ok(staging.includes(migration),"Staging migration omitted: "+migration);
});

test("health, privacy and payment guards are present",()=>{
 const health=read("app/api/health/route.ts"),live=read("app/api/health/live/route.ts");
 assert.match(health,/SELECT 1/);
 assert.match(health,/no-store/);
 assert.match(live,/alive/);
 const security=read("lib/security.ts");
 assert.match(security,/getServerConfig\(\)/);
 assert.doesNotMatch(security,/headers\(\)\.get\("host"\)/);
 assert.match(security,/maxBytes=16000/);
 const config=read("next.config.ts");
 for(const header of ["X-Frame-Options","X-Content-Type-Options","Referrer-Policy","Cache-Control"])assert.ok(config.includes(header));
 const orders=read("app/api/orders/route.ts");
 assert.match(orders,/getServerConfig\(\)\.production\|\|/);
});

test("operational release documentation exists",()=>{
 for(const file of ["docs/ARCHITECTURE.md","docs/PRODUCTION-READINESS.md","docs/RAILWAY-CONFIG.md","SECURITY.md","CONTRIBUTING.md"]){
  assert.ok(existsSync(file),"Required release document missing: "+file);
 }
});
