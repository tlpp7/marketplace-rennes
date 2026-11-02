import Link from "next/link";
import type { Product } from "@/modules/catalog/types";
export default function ProductCard({product}:{product:Product}){
 const image = product.images[0];
 return <Link className="product-card" href={`/produit/${product.slug}/`}>
  <div className="product-visual">
   {image ? <img src={image} alt={`${product.name}, ${product.condition}`} loading="lazy"/> : <div className="product-placeholder"><span aria-hidden="true">✳</span><small>Photo à venir</small></div>}
   <span className="product-label">{product.demo ? "Pièce démo" : product.status==="available" ? "Pièce unique" : "Indisponible"}</span>
   <span className="product-arrow" aria-hidden="true">↗</span>
  </div>
  <div className="product-details"><div><p className="product-brand">{product.brand} · {product.size}</p><h3>{product.name}</h3><p className="product-secondary">{product.condition} · {product.location}</p></div><strong className="product-price">{product.price.toLocaleString("fr-FR",{style:"currency",currency:"EUR"})}</strong></div>
 </Link>;
}
