import {Pool} from "pg";
declare global {var rennPool:Pool|undefined}
export const db=globalThis.rennPool ?? new Pool({connectionString:process.env.DATABASE_URL, max:5, ssl:process.env.PGSSL==="true"?{rejectUnauthorized:true}:undefined});
if(process.env.NODE_ENV!=="production")globalThis.rennPool=db;
export async function sql<T=Record<string,unknown>>(text:string,params:unknown[]=[]):Promise<T[]>{const r=await db.query(text,params);return r.rows as T[]}
