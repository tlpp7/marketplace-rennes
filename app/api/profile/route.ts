import {sql} from "@/lib/db";
import {body,currentUser,fail,stringField,trustedRequest} from "@/lib/security";
export const runtime="nodejs";
export async function GET(){const u=await currentUser();if(!u)return fail("Connexion requise",401);const r=await sql("SELECT kind,city,bio,approved FROM member_profiles WHERE user_id=$1",[u.id]);return Response.json({profile:r[0]??null})}
export async function PATCH(request:Request){if(!await trustedRequest(request))return fail("Origine non autorisée",403);const u=await currentUser();if(!u)return fail("Connexion requise",401);const d=await body(request),city=stringField(d.city,100),bio=stringField(d.bio,500),kind=stringField(d.kind,20);if(!["buyer","reseller","care"].includes(kind)||!city||city.length<2)return fail("Profil invalide");const r=await sql("UPDATE member_profiles SET kind=$2,city=$3,bio=$4,approved=false WHERE user_id=$1 RETURNING kind,city,bio,approved",[u.id,kind,city,bio]);return Response.json({profile:r[0]})}
