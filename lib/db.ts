import {Pool} from "pg";
import {getServerConfig} from "@/lib/config/env";
declare global {var rennPool:Pool|undefined}
const config=getServerConfig();
export const db=globalThis.rennPool ?? new Pool({
 connectionString:config.database.url||undefined,
 max:Math.min(config.database.maxConnections,50),
 connectionTimeoutMillis:5000,
 idleTimeoutMillis:30000,
 ssl:config.database.ssl?{rejectUnauthorized:true}:undefined
});
if(!config.production)globalThis.rennPool=db;
export async function sql<T=Record<string,unknown>>(text:string,params:unknown[]=[]):Promise<T[]>{
 const result=await db.query(text,params);return result.rows as T[];
}
