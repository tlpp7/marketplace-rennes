import {readFile} from "node:fs/promises";
import pg from "pg";

// This script is intentionally restricted to the disposable preproduction project.
// Never call it from the production service: production migrations require backups
// and a separately approved release procedure.
const expectedProject="b9e34156-7f21-4308-881f-5f8fe1048170";
const expectedEnvironment="da7a79e0-f66b-42d1-83ae-ffe9e76ef2d5";
if(process.env.RAILWAY_PROJECT_ID!==expectedProject ||
   process.env.RAILWAY_ENVIRONMENT_ID!==expectedEnvironment ||
   process.env.RF_DEPLOY_ROLE!=="staging") {
  throw Error("Migration refused: not the authorized RennFripes staging environment");
}
if(!process.env.DATABASE_URL)throw Error("Staging DATABASE_URL missing");

const client=new pg.Client({connectionString:process.env.DATABASE_URL});
const files=[
 "001_social.sql",
 "002_consignment.sql",
 "003_admin.sql",
 "004_orders.sql",
 "005_auth_guard.sql",
 "006_v02_operations.sql",
 "007_v02_hardening.sql"
];
await client.connect();
try {
 await client.query("BEGIN");
 await client.query("SELECT pg_advisory_xact_lock(2026, 2002)");
 for(const file of files){
  const source=await readFile(new URL("../infra/sql/"+file,import.meta.url),"utf8");
  await client.query(source);
  console.log("Staging schema applied:",file);
 }
 await client.query("COMMIT");
 console.log("RennFripes staging schema ready");
}catch(err){
 await client.query("ROLLBACK").catch(()=>{});
 throw err;
}finally{
 await client.end();
}
