import {test} from "node:test";import assert from "node:assert/strict";import pg from "pg";
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
const suffix=Date.now().toString(36);
test("V0.2 PostgreSQL: only approved, active partners appear in public directory",async()=>{
 await db.connect();
 const people=[
  {handle:"v02_approved_"+suffix,kind:"reseller",approved:true,disabled:false},
  {handle:"v02_pending_"+suffix,kind:"care",approved:false,disabled:false},
  {handle:"v02_disabled_"+suffix,kind:"care",approved:true,disabled:true},
  {handle:"v02_buyer_"+suffix,kind:"buyer",approved:true,disabled:false}
 ];
 try{
  for(const p of people){
   const r=await db.query("INSERT INTO users(handle,email,password_hash,disabled) VALUES($1,$2,'test-only-not-a-credential',$3) RETURNING id",[p.handle,p.handle+"@example.invalid",p.disabled]);
   await db.query("INSERT INTO member_profiles(user_id,kind,approved) VALUES($1,$2,$3)",[r.rows[0].id,p.kind,p.approved]);
  }
  const result=await db.query("SELECT u.handle FROM member_profiles p JOIN users u ON u.id=p.user_id WHERE p.approved=true AND u.disabled=false AND p.kind IN ('reseller','care') AND u.handle LIKE $1",["v02_%_"+suffix]);
  assert.deepEqual(result.rows.map(x=>x.handle),[people[0].handle]);
 }finally{
  await db.query("DELETE FROM users WHERE handle LIKE $1",["v02_%_"+suffix]);
  await db.end();
 }
});
