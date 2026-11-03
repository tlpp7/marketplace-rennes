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
 const triggers=await db.query("SELECT tgname FROM pg_trigger WHERE NOT tgisinternal");
 const present=new Set(triggers.rows.map(r=>r.tgname));
 const required=["trg_enforce_consignment_workflow","trg_receipts_immutable","trg_quality_immutable","trg_mandates_immutable","trg_publications_immutable"];
 const missingTriggers=required.filter(v=>!present.has(v));
 if(missingTriggers.length)throw Error("Triggers V0.2 manquants : "+missingTriggers.join(", "));
 console.log("PostgreSQL OK:",rows[0].db,"—",expected.length,"tables et",required.length,"triggers requis présents");
}catch(e){console.error("PostgreSQL NON PRÊT:",e.message);process.exitCode=1}finally{await db.end().catch(()=>{})}
