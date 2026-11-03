import type {Metadata} from "next";import {redirect} from "next/navigation";import {currentAdmin} from "@/lib/admin";import AdminCommunityPanel from "@/components/AdminCommunityPanel";
export const metadata:Metadata={title:"Modération de la communauté",robots:{index:false,follow:false}};export const dynamic="force-dynamic";
export default async function AdminCommunity(){if(!await currentAdmin())redirect("/compte/");return <main className="shell account-page"><span className="section-kicker">ADMINISTRATION / COMMUNAUTÉ</span><h1>Profils et avis.</h1><AdminCommunityPanel/></main>}
