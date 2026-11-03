import {createHash,randomBytes} from "node:crypto";
import {sql} from "@/lib/db";
export const digest=(v:string)=>createHash("sha256").update(v).digest("hex");
export async function throttled(key:string):Promise<boolean>{
 const rows=await sql<{blocked:boolean}>("SELECT (blocked_until IS NOT NULL AND blocked_until>now()) AS blocked FROM auth_attempts WHERE key_hash=$1",[digest(key)]);
 return rows[0]?.blocked??false;
}
export async function recordFailure(key:string){
 await sql(`INSERT INTO auth_attempts(key_hash,failures,window_started,blocked_until) VALUES($1,1,now(),NULL)
 ON CONFLICT(key_hash) DO UPDATE SET
 failures=CASE WHEN auth_attempts.window_started<now()-interval '15 minutes' THEN 1 ELSE auth_attempts.failures+1 END,
 window_started=CASE WHEN auth_attempts.window_started<now()-interval '15 minutes' THEN now() ELSE auth_attempts.window_started END,
 blocked_until=CASE WHEN auth_attempts.window_started>=now()-interval '15 minutes' AND auth_attempts.failures>=4 THEN now()+interval '15 minutes' ELSE NULL END`,[digest(key)]);
}
export async function clearFailures(key:string){await sql("DELETE FROM auth_attempts WHERE key_hash=$1",[digest(key)])}
export async function createToken(userId:string,kind:"verify"|"reset"){
 const token=randomBytes(32).toString("hex");
 await sql("INSERT INTO account_tokens(token_hash,user_id,kind,expires_at) VALUES($1,$2,$3,now()+interval '30 minutes')",[digest(token),userId,kind]);
 return token;
}
