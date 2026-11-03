import fs from "node:fs/promises";
import pg from "pg";
if(!process.env.DATABASE_URL)throw Error("DATABASE_URL non défini : aucune migration exécutée");
const migrations=["006_v02_operations.sql","007_v02_hardening.sql"];
const sources=await Promise.all(migrations.map(file=>fs.readFile(new URL("../infra/sql/"+file,import.meta.url),"utf8")));
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try{
 const r=await client.query("SELECT current_database() AS name,to_regclass('public.consignment_inventory') AS inventory");
 if(!r.rows[0].inventory)throw Error("Schéma V0.2 antérieur absent. Appliquer 001 à 005 d'abord.");
 if(!/test/i.test(r.rows[0].name)&&process.env.RF_V02_ALLOW_PRODUCTION!=="I_HAVE_A_VERIFIED_BACKUP")
  throw Error("Migration refusée hors base de test : sauvegarde/restauration vérifiées et RF_V02_ALLOW_PRODUCTION requis");
 console.log("Migration V0.2 sur la base :",r.rows[0].name);
 await client.query("BEGIN");
 for(let i=0;i<migrations.length;i++){
  await client.query(sources[i]);
  console.log("Migration appliquée :",migrations[i]);
 }
 await client.query("COMMIT");
 console.log("Migrations V0.2 terminées avec succès.");
}catch(error){
 await client.query("ROLLBACK").catch(()=>{});
 console.error("Migration annulée :",error instanceof Error?error.message:"Erreur");
 process.exitCode=1;
}finally{await client.end()}
