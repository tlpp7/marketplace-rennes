import pg from "pg";
const url=process.env.DATABASE_URL;if(!url){console.error("DATABASE_URL absent");process.exit(1)}
const db=new pg.Client({connectionString:url});try{
 await db.connect();
 const {rows}=await db.query("SELECT current_database() AS db,version() AS version");
 const tables=await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
 const list=new Set(tables.rows.map(r=>r.tablename));
 const expected=["users","sessions","member_profiles","follows","conversations","messages","appointments","reviews","consignment_requests","marketplace_orders","account_tokens","consignment_receipts","consignment_quality_reports","consignment_mandates","consignment_publications"];
 const missing=expected.filter(v=>!list.has(v));
 if(missing.length)throw Error("Migrations manquantes : "+missing.join(", "));
 console.log("PostgreSQL OK:",rows[0].db,"—",expected.length,"tables requises présentes");
}catch(e){console.error("PostgreSQL NON PRÊT:",e.message);process.exitCode=1}finally{await db.end().catch(()=>{})}
