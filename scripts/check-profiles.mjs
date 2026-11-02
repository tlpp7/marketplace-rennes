import fs from "node:fs";
const profiles=JSON.parse(fs.readFileSync(new URL("../data/profiles.json",import.meta.url),"utf8"));
const ids=new Set(),slugs=new Set();
for(const p of profiles){
 if(!p.id||!p.slug||!p.name||!["care","reseller"].includes(p.kind)||!Array.isArray(p.services)||!Array.isArray(p.specialties)||p.demo!==true||p.verified!==false)throw Error("Profil de démonstration invalide : "+JSON.stringify(p));
 if(ids.has(p.id)||slugs.has(p.slug))throw Error("Identifiant ou slug de profil dupliqué");
 ids.add(p.id);slugs.add(p.slug);
}
console.log(`${profiles.length} profils fictifs valides`);
