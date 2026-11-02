import type {Metadata} from "next";
import Link from "next/link";
import JourneyDiagram from "@/components/JourneyDiagram";
import CommunityLayer from "@/components/CommunityLayer";
import CareServicesLayer from "@/components/CareServicesLayer";
export const metadata:Metadata={title:"Dépôt-vente de vêtements à Rennes",description:"Découvrez le projet Renn'Fripes : un dépôt-vente local associé à une communauté et à de futurs services de soin textile à Rennes."};
export default function Depot(){return <main><section className="shell depot-hero"><span className="section-kicker">DÉPÔT-VENTE • RENNES</span><h1>Ton dressing change.<br/><em>Pas besoin de tout jeter.</em></h1><p>On prépare un service de dépôt-vente local pour donner une seconde vie aux vêtements que tu aimes, mais ne portes plus.</p><span className="pill">Ouverture en préparation — aucun dépôt accepté actuellement</span></section><JourneyDiagram/><CommunityLayer/><CareServicesLayer/><section className="shell depot-final"><div><span className="section-kicker">LA SUITE DE L’HISTOIRE</span><h2>Un vestiaire qui se transmet.</h2><p>Le service est en construction. Les conditions de dépôt, les commissions et les protections des utilisateurs seront communiquées avant l'ouverture.</p></div><Link href="/catalogue/" className="button button-dark">Découvrir le catalogue ↗</Link></section></main>}
