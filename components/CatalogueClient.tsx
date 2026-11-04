"use client";
import {useMemo,useState} from "react";
import ProductCard from "@/components/ProductCard";
import type {Product} from "@/modules/catalog/types";
export default function CatalogueClient({products,liveCount=0}:{products:Product[];liveCount?:number}){
 const [query,setQuery]=useState("");
 const [category,setCategory]=useState("all");
 const [sort,setSort]=useState("default");
 const categories=Array.from(new Set(products.map(p=>p.category)));
 const filtered=useMemo(()=>{
  const q=query.toLocaleLowerCase("fr").trim();
  const arr=products.filter(p=>(category==="all"||p.category===category)&&[p.name,p.brand,p.size,p.description].join(" ").toLocaleLowerCase("fr").includes(q));
  if(sort==="price-asc")arr.sort((a,b)=>a.price-b.price);
  if(sort==="price-desc")arr.sort((a,b)=>b.price-a.price);
  return arr;
 },[products,query,category,sort]);
 return <>
  <div className="demo-note">{liveCount>0?String(liveCount)+" article(s) réellement référencé(s). Les articles démo sont fictifs ; aucune commande en ligne n'est encore ouverte.":"Aucun vêtement réel publié pour le moment. Les pièces ci-dessous sont des démonstrations non commercialisées."}</div>
  <div className="catalog-controls">
   <input type="search" aria-label="Rechercher un vêtement" placeholder="Rechercher une pièce, une marque, une taille…" value={query} onChange={e=>setQuery(e.target.value)}/>
   <select aria-label="Filtrer par catégorie" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Toutes les catégories</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select>
   <select aria-label="Trier le catalogue" value={sort} onChange={e=>setSort(e.target.value)}><option value="default">Trier : sélection</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option></select>
  </div>
  <p className="catalog-count" role="status">{filtered.length} pièce{filtered.length>1?"s":""} affichée{filtered.length>1?"s":""}</p>
  {filtered.length?<div className="product-grid">{filtered.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="catalog-empty"><h2>Pas encore de pièce pour cette recherche.</h2><p>Essaie une autre catégorie ou un autre mot-clé.</p></div>}
 </>;
}
