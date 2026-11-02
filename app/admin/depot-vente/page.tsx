import type {Metadata} from "next";import {redirect} from "next/navigation";import {currentAdmin} from "@/lib/admin";import AdminInventoryPanel from "@/components/AdminInventoryPanel";
import AdminConsignmentPanel from "@/components/AdminConsignmentPanel";
export const metadata:Metadata={title:"Administration des dépôts",robots:{index:false,follow:false}};export const dynamic="force-dynamic";
export default async function AdminDepot(){if(!await currentAdmin())redirect("/compte/");return <main className="shell account-page"><span className="section-kicker">RENN’FRIPES / ADMINISTRATION</span><h1>Gestion des dépôts.</h1><AdminConsignmentPanel/><AdminInventoryPanel/></main>}
