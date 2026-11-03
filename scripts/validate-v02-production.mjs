#!/usr/bin/env node
// V0.2 — recette HTTP non destructive d'un environnement déployé.
// Usage: node scripts/validate-v02-production.mjs --url https://staging.example.org [--json path]
// Does not create accounts, change approvals, or edit database records.
import fs from "node:fs";
const argv=process.argv.slice(2);
function arg(key){const n=argv.indexOf(key);return n<0?undefined:argv[n+1]}
const raw=arg("--url"),reportPath=arg("--json");
if(!raw){console.error("Usage: node scripts/validate-v02-production.mjs --url https://staging.example.org [--json path]");process.exit(2)}
let base;try{base=new URL(raw);if(!["https:","http:"].includes(base.protocol))throw Error("Protocole refusé");if(base.username||base.password||base.search||base.hash)throw Error("URL avec identifiants ou paramètres refusée");base=base.origin}catch(e){console.error("URL invalide:",e.message);process.exit(2)}
const isLocal=new URL(base).hostname.match(/^(localhost|127\.0\.0\.1|\[::1\])$/);
const results=[];
async function fetchPath(path){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);try{return await fetch(base+path,{redirect:"follow",signal:controller.signal,headers:{Accept:"text/html, application/json;q=0.9"}})}finally{clearTimeout(timer)}}
async function check(id,label,run){const started=Date.now();try{const message=await run();results.push({id,label,status:"PASS",detail:String(message||"OK"),ms:Date.now()-started})}catch(e){results.push({id,label,status:"FAIL",detail:String(e.message||e),ms:Date.now()-started})}}
function assert(condition,message){if(!condition)throw Error(message)}
let home,listing,html="",api;
await check("V02-OP-001","Accueil disponible",async()=>{home=await fetchPath("/");assert(home.status===200,"HTTP "+home.status);return "HTTP 200"});
await check("V02-OP-002","Annuaire disponible",async()=>{listing=await fetchPath("/profils/");assert(listing.status===200,"HTTP "+listing.status);html=await listing.text();assert(/profils|revendeurs/i.test(html),"Contenu annuaire absent");return "HTTP 200"});
await check("V02-OP-003","Quatre fiches de démonstration",async()=>{for(const slug of ["atelier-seconde-vie-demo","studio-vestiaire-demo","vestiaire-circulaire-demo","pieces-a-transmettre-demo"]){const r=await fetchPath("/profils/"+slug+"/");assert(r.status===200,slug+": HTTP "+r.status)}return "4 fiches HTTP 200"});
await check("V02-OP-004","Démonstrations clairement étiquetées",async()=>{assert(/fictifs|démonstration/i.test(html),"Marquage fictif absent de l'annuaire");return "Marquage explicite"});
await check("V02-OP-005","Nom et structure HTML",async()=>{assert(/<html[^>]*lang=["']fr["']/i.test(html),"Langue HTML absente");assert(/<main\b/i.test(html),"Balise main absente");assert(/<h1\b/i.test(html),"Titre H1 absent");return "HTML français, main et H1"});
await check("V02-OP-006","Ressource inconnue retourne 404",async()=>{const r=await fetchPath("/profils/slug-inexistant-recette-v02/");assert(r.status===404,"HTTP "+r.status+" au lieu de 404");return "HTTP 404"});
await check("V02-OP-011","Navigation vers les fiches",async()=>{assert(/href=["'][^"']*\/profils\/atelier-seconde-vie-demo\/?["']/i.test(html),"Lien vers première fiche absent");return "Lien détecté"});
await check("V02-OP-015","API publique de l'annuaire",async()=>{const r=await fetchPath("/api/directory/");assert(r.status===200,"HTTP "+r.status);api=await r.json();assert(Array.isArray(api.profiles),"Réponse API sans tableau profiles");return api.profiles.length+" partenaires publiés"});
await check("V02-OP-016","Minimisation des données API publiques",async()=>{assert(api&&Array.isArray(api.profiles),"API non disponible");for(const p of api.profiles){assert(typeof p.handle==="string"&&["care","reseller"].includes(p.kind),"Entrée incohérente");for(const field of ["email","password_hash","id","disabled","session_secret","approved"]){assert(!(field in p),"Champ interne exposé: "+field)}}return "Aucun champ privé attendu exposé"});
await check("V02-OP-020","HTTPS sur environnement public",async()=>{assert(new URL(base).protocol==="https:"||isLocal,"HTTPS requis hors machine locale");return base});
await check("V02-OP-021","En-têtes de base",async()=>{assert(home,"Accueil non disponible");const ct=home.headers.get("content-type")||"";assert(ct.includes("text/html"),"Content-Type inattendu: "+ct);const nosniff=home.headers.get("x-content-type-options");assert(nosniff==="nosniff","X-Content-Type-Options: nosniff manquant");return "Content-Type et nosniff"});
await check("V02-OP-023","Contrôle robots et sitemap",async()=>{const r=await fetchPath("/robots.txt");assert(r.status===200,"robots.txt HTTP "+r.status);const text=await r.text();assert(/User-agent:/i.test(text),"robots.txt invalide");return /Disallow:\s*\//i.test(text)?"Indexation interdite (préproduction)":"Règles robots présentes"});
console.log("\nRECETTE HTTP V0.2 : "+base+"\n");
for(const r of results)console.log((r.status==="PASS"?"✔ ":"✖ ")+r.id+" | "+r.label+" | "+r.detail);
const failed=results.filter(r=>r.status==="FAIL");
console.log("\n"+(results.length-failed.length)+"/"+results.length+" contrôles automatisés réussis.");
const report={scope:"V0.2 HTTP non destructive",url:base,checkedAt:new Date().toISOString(),results};
if(reportPath){fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+"\n");console.log("Rapport : "+reportPath)}
if(failed.length)process.exitCode=1;
