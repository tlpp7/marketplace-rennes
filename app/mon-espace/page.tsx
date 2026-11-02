import type {Metadata} from "next";
import AccountWorkspace from "@/components/AccountWorkspace";
export const metadata:Metadata={title:"Mon espace",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default function Dashboard(){return <main className="shell account-page"><span className="section-kicker">RENN’FRIPES / MEMBRES</span><h1>Mon espace<span className="accent">.</span></h1><AccountWorkspace/></main>}
