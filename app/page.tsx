import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/modules/catalog/repository";
export default function Home(){
 return <main>
  <section className="hero shell">
   <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> LA SECONDE MAIN, VERSION RENNAISE</div><h1>Le style tourne.<br/><em>Les belles pièces</em><br/>restent.</h1><p>Des vêtements qui ont déjà une histoire. Une nouvelle façon de chiner et de transmettre son vestiaire, à Rennes.</p>
   <div className="hero-actions"><Link href="/catalogue/" className="button button-dark">Explorer les pièces <span aria-hidden="true">↗</span></Link><Link href="/depot-vente/rennes/" className="button button-plain">Comment déposer <span aria-hidden="true">→</span></Link></div>
   <div className="hero-note"><span className="round-star">✳</span> Un projet local, pensé pour durer.</div>
   </div>
   <div className="hero-art" role="img" aria-label="Composition graphique abstraite de vêtements de seconde main"><div className="art-circle"/><div className="art-garment"><div className="garment-neck"/><div className="garment-label">RENN’<br/>FRIPES</div></div><span className="art-stamp">PIÈCES À<br/>RÉINVENTER ✳</span><span className="art-caption">Rennes • Bretagne<br/>Seconde main, première classe.</span></div>
  </section>
  <section className="values-bar"><div className="shell values-inner"><span>✳ Sélection raisonnée</span><span>↗ Pensé à Rennes</span><span>♻ Vêtements de seconde main</span><span>♡ Un style qui circule</span></div></section>
  <section className="shell section-gap"><div className="section-heading"><div><span className="section-kicker">LE VESTIAIRE</span><h2>Les pièces à découvrir<span className="accent">.</span></h2></div><Link href="/catalogue/" className="text-link">Voir tout le catalogue ↗</Link></div><p className="demo-note">Aperçu de démonstration — ces articles ne sont pas en vente.</p><div className="product-grid">{getProducts().map(p=><ProductCard key={p.id} product={p}/>)}</div></section>
  <section className="shell editorial-block"><div className="editorial-shape" aria-hidden="true"><span>R</span><span>✳</span></div><div><span className="section-kicker">ET SI ON FAISAIT AUTREMENT ?</span><h2>Ton dressing a encore <em>plein de choses à raconter.</em></h2><p>On imagine un dépôt-vente local qui simplifie la vie : sélection, photos, mise en ligne et suivi des pièces. Le service est encore en construction.</p><Link href="/depot-vente/rennes/" className="button button-light">Découvrir le futur service ↗</Link></div></section>
  <section className="shell how-section"><div className="section-heading"><div><span className="section-kicker">UN CIRCUIT PLUS SIMPLE</span><h2>Trois gestes, une nouvelle vie<span className="accent">.</span></h2></div></div><div className="step-grid"><div><span>01</span><h3>Fais le tri</h3><p>Repère les pièces que tu ne portes plus et qui méritent une nouvelle histoire.</p></div><div><span>02</span><h3>On les valorise</h3><p>Notre futur service prévoit un contrôle de l'état, des photos et un prix cohérent.</p></div><div><span>03</span><h3>Elles repartent</h3><p>Les pièces trouvent un nouveau vestiaire grâce à la seconde main.</p></div></div></section>
 </main>
}
