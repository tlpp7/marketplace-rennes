import {sql} from "@/lib/db";import {currentUser} from "@/lib/security";
export async function currentAdmin(){const user=await currentUser();if(!user)return null;const rows=await sql("SELECT user_id FROM platform_admins WHERE user_id=$1",[user.id]);return rows.length?user:null}
