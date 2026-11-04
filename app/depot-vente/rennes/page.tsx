import type {Metadata} from "next";
import Link from "next/link";
import JourneyDiagram from "@/components/JourneyDiagram";
import CommunityLayer from "@/components/CommunityLayer";
import CareServicesLayer from "@/components/CareServicesLayer";
export const metadata:Metadata={title:"Dépôt-vente de vêtements à Rennes",description:"Découvrez le projet Renn'Fripes : un dépôt-vente local associé à une communauté et à de futurs services de soin textile à Rennes."};
export default function Depot(){return <main><section className="shell depot-hero"><span className="section-kicker">DÉPÔT-VENTE • RENNES</span><h1>Ton dressing change.<br/><em>Pas besoin de tout jeter.</em></h1><p>Propose tes vêtements depuis ton espace membre. Chaque pièce est évaluée, réceptionnée et contractualisée avant d’être publiée.</p><span className="pill">Dépôts physiques uniquement après confirmation de Renn’Fripes</span></section><JourneyDiagram/><CommunityLayer/><CareServicesLayer/><section className="shell depot-final"><div><span className="section-kicker">LA SUITE DE L’HISTOIRE</span><h2>Un vestiaire qui se transmet.</h2><p>Les conditions et la commission sont présentées au déposant dans son mandat avant validation. Aucun dépôt physique ne doit être envoyé sans confirmation.</p></div><Link href="/catalogue/" className="button button-dark">Découvrir le catalogue ↗</Link></section></main>}
