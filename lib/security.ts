import {createHmac,randomBytes,scryptSync,timingSafeEqual} from "node:crypto";
import {cookies} from "next/headers";
import {sql} from "./db";
import {getServerConfig} from "@/lib/config/env";
export type Actor={id:string;handle:string};
const key=()=>{const k=getServerConfig().session.secret;if(k.length<32)throw Error("SESSION_SECRET must contain at least 32 characters");return k};
export function hashPassword(p:string){const salt=randomBytes(16).toString("hex");return salt+":"+scryptSync(p,salt,64).toString("hex")}
export function checkPassword(p:string,h:string){const [salt,digest]=h.split(":");if(!salt||!digest||digest.length!==128)return false;const a=scryptSync(p,salt,64),b=Buffer.from(digest,"hex");return a.length===b.length&&timingSafeEqual(a,b)}
const sign=(id:string)=>createHmac("sha256",key()).update(id).digest("hex");
export function newSessionToken(){const id=randomBytes(32).toString("hex");return id+"."+sign(id)}
export function verifyToken(raw:string|undefined){if(!raw)return null;const [id,mac]=raw.split(".");if(!id||!mac||mac.length!==64)return null;const expected=Buffer.from(sign(id),"hex");const actual=Buffer.from(mac,"hex");return actual.length===expected.length&&timingSafeEqual(actual,expected)?id:null}
export async function currentUser():Promise<Actor|null>{const token=verifyToken((await cookies()).get("rf_session")?.value);if(!token)return null;const r=await sql<Actor>("SELECT u.id,u.handle FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=$1 AND s.expires_at>now() AND u.disabled=false",[token]);return r[0]??null}
export async function setSession(userId:string){const token=newSessionToken();const id=token.split(".")[0];await sql("INSERT INTO sessions(id,user_id,expires_at) VALUES ($1,$2,now()+interval '7 days')",[id,userId]);(await cookies()).set("rf_session",token,{httpOnly:true,secure:getServerConfig().production,sameSite:"lax",path:"/",maxAge:604800})}
export async function clearSession(){const raw=(await cookies()).get("rf_session")?.value;const id=verifyToken(raw);if(id)await sql("DELETE FROM sessions WHERE id=$1",[id]);(await cookies()).delete("rf_session")}
// Compare against the configured public origin, never the user-controlled Host header.
export async function trustedRequest(request:Request){
 const raw=request.headers.get("origin");
 if(!raw)return false;
 try{
  const origin=new URL(raw);
  if(!["https:","http:"].includes(origin.protocol)||origin.username||origin.password||origin.search||origin.hash||origin.pathname!=="/")return false;
  const config=getServerConfig();
  if(config.urls.appOrigin)return origin.origin===config.urls.appOrigin;
  if(config.production)return false; // Fail closed without APP_ORIGIN
  const target=new URL(request.url);
  const loopback=["localhost","127.0.0.1","[::1]"];
  return loopback.includes(target.hostname)&&loopback.includes(origin.hostname)
   &&origin.protocol===target.protocol&&origin.port===target.port;
 }catch{return false}
}
export function fail(message:string,status=400){return Response.json({error:message},{status})}
// Reject oversized streamed bodies even when Content-Length is missing or forged.
export async function body(request:Request):Promise<Record<string,unknown>>{
 const maxBytes=16000;
 const sizeHeader=request.headers.get("content-length");
 if(sizeHeader!==null){
  const announced=Number(sizeHeader);
  if(!Number.isSafeInteger(announced)||announced<0||announced>maxBytes)throw Error("Corps trop volumineux");
 }
 const type=request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
 if(type!=="application/json")throw Error("Contenu JSON attendu");
 if(!request.body)throw Error("Corps JSON manquant");
 const reader=request.body.getReader();
 const chunks:Buffer[]=[];
 let total=0;
 try{
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   total+=value.byteLength;
   if(total>maxBytes){await reader.cancel();throw Error("Corps trop volumineux")}
   chunks.push(Buffer.from(value));
  }
 }finally{reader.releaseLock()}
 let v:unknown;
 try{v=JSON.parse(Buffer.concat(chunks,total).toString("utf8"))}catch{throw Error("Corps JSON invalide")}
 if(!v||typeof v!=="object"||Array.isArray(v))throw Error("Corps JSON invalide");
 return v as Record<string,unknown>;
}
export function stringField(v:unknown,max=500){return typeof v==="string"?v.trim().slice(0,max):""}
