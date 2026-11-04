import assert from "node:assert/strict";
import {test} from "node:test";
import {readFile} from "node:fs/promises";
import ts from "typescript";

const source=await readFile(new URL("../lib/config/env.ts",import.meta.url),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {getServerConfig,validateDeploymentConfig}=await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));

const base={
 NODE_ENV:"production",
 DATABASE_URL:"postgresql://user:password@postgres.railway.internal:5432/railway",
 SESSION_SECRET:"x".repeat(48),
 APP_ORIGIN:"https://rennfripes.example",
 NEXT_PUBLIC_SITE_URL:"https://rennfripes.example",
 ACCOUNTS_ENABLED:"false",ORDERS_ENABLED:"false",SEO_PUBLIC:"false",ALLOW_UNVERIFIED_LOCAL:"false"
};
test("defaults fail closed and validates baseline production",()=>{
 const conf=validateDeploymentConfig({...base});
 assert.equal(conf.flags.ordersEnabled,false);
 assert.equal(conf.flags.accountsEnabled,false);
 assert.equal(conf.flags.seoPublic,false);
 assert.equal(conf.database.maxConnections,5);
 assert.equal(conf.mail.configured,false);
});
test("invalid booleans and ports are rejected",()=>{
 assert.throws(()=>getServerConfig({...base,ORDERS_ENABLED:"yes"}),/ORDERS_ENABLED/);
 assert.throws(()=>getServerConfig({...base,SMTP_PORT:"99999"}),/SMTP_PORT/);
 assert.throws(()=>getServerConfig({...base,PGPOOL_MAX:"0"}),/PGPOOL_MAX/);
});
test("origin must be HTTPS, consistent and cannot contain credentials",()=>{
 assert.throws(()=>getServerConfig({...base,APP_ORIGIN:"http://rennfripes.example"}),/APP_ORIGIN/);
 assert.throws(()=>getServerConfig({...base,APP_ORIGIN:"https://user:password@rennfripes.example"}),/APP_ORIGIN/);
 assert.throws(()=>validateDeploymentConfig({...base,NEXT_PUBLIC_SITE_URL:"https://other.example"}),/must match/);
});
test("local bypass is forbidden in production",()=>{
 assert.throws(()=>validateDeploymentConfig({...base,ALLOW_UNVERIFIED_LOCAL:"true"}),/forbidden/);
});
test("orders remain disabled without verified payment integration",()=>{
 assert.throws(()=>validateDeploymentConfig({...base,ORDERS_ENABLED:"true"}),/ORDERS_ENABLED/);
});
test("public accounts require fully configured SMTP",()=>{
 assert.throws(()=>validateDeploymentConfig({...base,ACCOUNTS_ENABLED:"true"}),/SMTP/);
 const ok=validateDeploymentConfig({...base,ACCOUNTS_ENABLED:"true",SMTP_HOST:"smtp.example",SMTP_FROM:"contact@example.org",SMTP_USER:"user",SMTP_PASSWORD:"pass"});
 assert.equal(ok.mail.configured,true);
});
test("S3 is optional, but partial credentials are rejected",()=>{
 assert.equal(getServerConfig({...base}).media.storage.configured,false);
 assert.throws(()=>getServerConfig({...base,S3_BUCKET:"media"}),/S3_ENDPOINT/);
 const cfg=getServerConfig({...base,S3_ENDPOINT:"https://s3.example",S3_BUCKET:"media",S3_REGION:"auto",S3_ACCESS_KEY_ID:"key",S3_SECRET_ACCESS_KEY:"secret"});
 assert.equal(cfg.media.storage.configured,true);
 assert.equal(cfg.media.storage.bucket,"media");
});
test("secret and DB URL are validated without printing their values",()=>{
 assert.throws(()=>validateDeploymentConfig({...base,SESSION_SECRET:"short"}),/SESSION_SECRET/);
 assert.throws(()=>validateDeploymentConfig({...base,DATABASE_URL:"https://bad.example"}),/DATABASE_URL/);
});
test("development supports local HTTP origin without public accounts",()=>{
 const cfg=getServerConfig({NODE_ENV:"development",APP_ORIGIN:"http://127.0.0.1:3000",ORDERS_ENABLED:"false"});
 assert.equal(cfg.urls.appOrigin,"http://127.0.0.1:3000");
 assert.equal(cfg.flags.accountsEnabled,false);
});
