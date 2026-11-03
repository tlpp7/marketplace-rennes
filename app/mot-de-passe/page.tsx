import {Suspense} from "react";import PasswordRecovery from "@/components/PasswordRecovery";
export const metadata={title:"Mot de passe | Renn'Fripes",robots:{index:false,follow:false}};
export default function PasswordPage(){return <main className="shell account-page"><h1>Accès à ton compte.</h1><Suspense fallback={<p>Chargement…</p>}><PasswordRecovery/></Suspense></main>}
