import fs from "node:fs";
const products=JSON.parse(fs.readFileSync(new URL("../data/products.json",import.meta.url),"utf8"));
const ids=new Set(),slugs=new Set();for(const p of products){if(!p.id||!p.slug||!p.name||!Number.isFinite(p.price)||p.price<0)throw Error("Produit invalide: "+JSON.stringify(p));if(ids.has(p.id)||slugs.has(p.slug))throw Error("SKU ou slug dupliqué");ids.add(p.id);slugs.add(p.slug)}console.log(`${products.length} produit(s) valides`);
