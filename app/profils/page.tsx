import type {Metadata} from "next";
import ProfileDirectory from "@/components/ProfileDirectory";
import {getProfiles} from "@/modules/profiles/repository";
export const metadata:Metadata={title:"Revendeurs & services textiles",description:"Découvrez les futurs profils de revendeurs et de prestataires textiles Renn'Fripes à Rennes."};
export default function Profiles(){return <main className="shell profiles-page"><span className="section-kicker">L'ÉCOSYSTÈME RENN'FRIPES</span><h1>Des personnes qui <em>font circuler les pièces.</em></h1><p className="profile-lead">Une place pour découvrir des revendeurs et des personnes qui valorisent les vêtements. Cette version présente uniquement des profils fictifs pour tester le futur service.</p><p className="demo-note">Démonstration — aucun profil n'est actif, aucun avis n'est vérifié et aucune réservation n'est possible.</p><ProfileDirectory profiles={getProfiles()}/></main>}
