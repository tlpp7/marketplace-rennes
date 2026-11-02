import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import {getProducts} from "@/modules/catalog/repository";
export default function Home(){return <main className="wrap"><section className="hero"><p className="eyebrow">Mode circulaire · Rennes</p><h1>Les vêtements méritent une seconde histoire.</h1><p className="muted">Découvrez notre projet de marketplace de seconde main et de dépôt-vente local. Le service commercial n’est pas encore ouvert.</p><Link className="btn" href="/catalogue/">Découvrir le catalogue</Link><Link className="btn secondary" href="/depot-vente/rennes/">Comprendre le dépôt-vente</Link></section><h2>Exemples de fiches produits</h2><div className="grid">{getProducts().map(p=><ProductCard key={p.id} product={p}/>)}</div></main>}
