import {createHmac,randomBytes,scryptSync,timingSafeEqual} from "node:crypto";
import {cookies,headers} from "next/headers";
import {sql} from "./db";
export type Actor={id:string;handle:string};
const key=()=>{const k=process.env.SESSION_SECRET;if(!k||k.length<32)throw Error("SESSION_SECRET must contain at least 32 characters");return k};
export function hashPassword(p:string){const salt=randomBytes(16).toString("hex");return salt+":"+scryptSync(p,salt,64).toString("hex")}
export function checkPassword(p:string,h:string){const [salt,digest]=h.split(":");if(!salt||!digest||digest.length!==128)return false;const a=scryptSync(p,salt,64),b=Buffer.from(digest,"hex");return a.length===b.length&&timingSafeEqual(a,b)}
const sign=(id:string)=>createHmac("sha256",key()).update(id).digest("hex");
export function newSessionToken(){const id=randomBytes(32).toString("hex");return id+"."+sign(id)}
export function verifyToken(raw:string|undefined){if(!raw)return null;const [id,mac]=raw.split(".");if(!id||!mac||mac.length!==64)return null;const expected=Buffer.from(sign(id),"hex");const actual=Buffer.from(mac,"hex");return actual.length===expected.length&&timingSafeEqual(actual,expected)?id:null}
export async function currentUser():Promise<Actor|null>{const token=verifyToken((await cookies()).get("rf_session")?.value);if(!token)return null;const r=await sql<Actor>("SELECT u.id,u.handle FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=$1 AND s.expires_at>now() AND u.disabled=false",[token]);return r[0]??null}
export async function setSession(userId:string){const token=newSessionToken();const id=token.split(".")[0];await sql("INSERT INTO sessions(id,user_id,expires_at) VALUES ($1,$2,now()+interval '7 days')",[id,userId]);(await cookies()).set("rf_session",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:604800})}
export async function clearSession(){const raw=(await cookies()).get("rf_session")?.value;const id=verifyToken(raw);if(id)await sql("DELETE FROM sessions WHERE id=$1",[id]);(await cookies()).delete("rf_session")}
export async function trustedRequest(request:Request){const origin=request.headers.get("origin");const host=(await headers()).get("host");return !!origin&&!!host&&new URL(origin).host===host}
export function fail(message:string,status=400){return Response.json({error:message},{status})}
export async function body(request:Request):Promise<Record<string,unknown>>{const size=Number(request.headers.get("content-length")??0);if(size>16000)throw Error("Corps trop volumineux");const v=await request.json();if(!v||typeof v!=="object"||Array.isArray(v))throw Error("Corps JSON invalide");return v}
export function stringField(v:unknown,max=500){return typeof v==="string"?v.trim().slice(0,max):""}
