import Link from "next/link";
export default function Header(){
 return <header className="site-header">
  <div className="announcement">Le vestiaire circulaire rennais · Notre boutique est en préparation</div>
  <nav className="shell navbar" aria-label="Navigation principale">
   <Link className="wordmark" href="/" aria-label="Renn'Fripes, accueil">renn<span>’</span>fripes<span className="wordmark-dot">.</span></Link>
   <div className="navlinks">
    <Link href="/catalogue/">Chiner</Link>
    <Link href="/depot-vente/rennes/">Déposer ses pièces</Link>
    <Link href="/profils/">La communauté</Link>
    <Link href="/a-propos/">Notre histoire</Link>
   </div>
   <Link className="nav-cta" href="/depot-vente/rennes/">Comment ça marche <span aria-hidden="true">↗</span></Link>
  </nav>
 </header>;
}
