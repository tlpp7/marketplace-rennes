import type {Metadata} from "next";import AccountPanel from "@/components/AccountPanel";
export const metadata:Metadata={title:"Compte Renn'Fripes",robots:{index:false,follow:false}};
export default function Account(){return <main className="shell account-page"><span className="section-kicker">ESPACE MEMBRE</span><h1>Ton histoire <em>continue ici.</em></h1><p>Un compte pour retrouver tes abonnements, tes conversations et tes demandes de rendez-vous. Un serveur PostgreSQL doit être configuré pour activer ces services.</p><AccountPanel/></main>}
