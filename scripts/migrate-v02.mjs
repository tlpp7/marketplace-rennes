import fs from "node:fs/promises";
import pg from "pg";
if(!process.env.DATABASE_URL)throw Error("DATABASE_URL non défini : aucune migration exécutée");
const source=await fs.readFile(new URL("../infra/sql/006_v02_operations.sql",import.meta.url),"utf8");
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try{
 const r=await client.query("SELECT current_database() AS name,to_regclass('public.consignment_inventory') AS inventory");
 if(!r.rows[0].inventory)throw Error("Schéma V0.2 antérieur absent. Appliquer 001 à 005 d'abord.");
 console.log("Migration V0.2 sur la base :",r.rows[0].name);
 await client.query("BEGIN");
 await client.query(source);
 await client.query("COMMIT");
 console.log("Migration 006 terminée avec succès.");
}catch(error){
 await client.query("ROLLBACK").catch(()=>{});
 console.error("Migration annulée :",error instanceof Error?error.message:"Erreur");
 process.exitCode=1;
}finally{await client.end()}
