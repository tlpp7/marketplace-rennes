import Link from "next/link";
import Image from "next/image";
import {notFound} from "next/navigation";
import {getProductBySlug} from "@/modules/catalog/repository";
import {getLiveProductBySlug} from "@/modules/catalog/live";
export const dynamic="force-dynamic";
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const p=getProductBySlug(slug)??await getLiveProductBySlug(slug);
 if(!p)notFound();
 return <main className="shell detail-page">
  <div className="breadcrumbs"><Link href="/">Accueil</Link> / <Link href="/catalogue/">Catalogue</Link> / {p.name}</div>
  <div className="detail-grid">
   <div className="detail-picture">{p.images[0]?<Image src={p.images[0]} alt={p.name} width={900} height={1100} sizes="(max-width: 768px) 100vw, 50vw"/>:<div className="product-placeholder"><span>✳</span><small>Photographie à venir</small></div>}</div>
   <div className="detail-info">
    <span className="section-kicker">{p.demo?"ARTICLE DE DÉMONSTRATION":"DÉPÔT-VENTE / PIÈCE RÉELLE"}</span>
    <p className="product-brand">{p.brand} · {p.category}</p><h1>{p.name}</h1>
    <div className="detail-price">{p.price.toLocaleString("fr-FR",{style:"currency",currency:"EUR"})}</div>
    <p className="demo-note">{p.demo?"Article fictif : ni vente ni réservation possible.":"Article référencé en stock. Les achats en ligne ne sont pas encore activés ; aucun paiement n'est collecté sur cette page."}</p>
    <div className="detail-specs"><div><span>Taille</span><strong>{p.size}</strong></div><div><span>État</span><strong>{p.condition}</strong></div><div><span>Localisation</span><strong>{p.location}</strong></div><div><span>Référence</span><strong>{p.id}</strong></div></div>
    <p>{p.description}</p><Link href="/catalogue/" className="button button-dark">Retour au vestiaire →</Link>
   </div>
  </div>
 </main>;
}
