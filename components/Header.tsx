import Link from "next/link";
export default function Header(){return <header className="top"><nav className="wrap nav"><Link className="brand" href="/">MARCHÉ RENNES</Link><div className="links"><Link href="/catalogue/">Catalogue</Link><Link href="/depot-vente/rennes/">Déposer</Link><Link href="/a-propos/">À propos</Link></div></nav></header>}
