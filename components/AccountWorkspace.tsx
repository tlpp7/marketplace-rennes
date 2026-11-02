"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import MemberDashboard from "@/components/MemberDashboard";
import ConsignmentPanel from "@/components/ConsignmentPanel";
type Tab="overview"|"deposits"|"community";
type Summary={deposits:number;active:number;following:number;messages:number;appointments:number};
const sections=[
{id:"overview" as Tab,name:"Vue d’ensemble",symbol:"⌂",subtitle:"L'essentiel au même endroit"},
{id:"deposits" as Tab,name:"Mes dépôts",symbol:"▣",subtitle:"Proposer et suivre mes pièces"},
{id:"community" as Tab,name:"Échanges & profil",symbol:"♡",subtitle:"Profils, messages, rendez-vous"}
];
export default function AccountWorkspace(){
 const [tab,setTab]=useState<Tab>("overview");
 const [summary,setSummary]=useState<Summary>({deposits:0,active:0,following:0,messages:0,appointments:0});
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  let mounted=true;
  async function load(){
   try{
    const urls=["/api/consignments","/api/follows","/api/conversations","/api/appointments"];
    const results=await Promise.all(urls.map(u=>fetch(u,{cache:"no-store"}).then(r=>r.ok?r.json():null)));
    if(!mounted)return;
    const requests=results[0]?.requests??[];
    setSummary({deposits:requests.length,active:requests.filter((r:{status:string})=>!["declined","withdrawn"].includes(r.status)).length,following:results[1]?.follows?.length??0,messages:results[2]?.conversations?.length??0,appointments:results[3]?.appointments?.length??0});
    setReady(true);
   }catch{if(mounted)setReady(true)}
  }
  void load();
  return()=>{mounted=false};
 },[tab]);
 return <div className="workspace-layout">
  <nav aria-label="Navigation de mon espace" className="workspace-nav">
   <div className="workspace-nav-intro"><span className="section-kicker">MON VESTIAIRE</span><p>Garde le fil de tes pièces et de tes échanges.</p></div>
   {sections.map(s=><button type="button" key={s.id} className={`workspace-nav-item ${tab===s.id?"is-active":""}`} onClick={()=>setTab(s.id)} aria-current={tab===s.id?"page":undefined}><span aria-hidden="true">{s.symbol}</span><span>{s.name}<small>{s.subtitle}</small></span><span aria-hidden="true">›</span></button>)}
   <Link className="workspace-explore" href="/catalogue/">Explorer les vêtements ↗</Link>
  </nav>
  <section className="workspace-main" aria-live="polite">
   {tab==="overview"&&<>
    <div className="workspace-welcome"><span className="section-kicker">TABLEAU DE BORD</span><h2>Bienvenue dans ton vestiaire<span className="accent">.</span></h2><p>Retrouve tes pièces, tes contacts et les prochaines étapes, sans te perdre dans les formulaires.</p></div>
    <div className="workspace-stats">
     <div><strong>{ready?summary.active:"—"}</strong><span>Dépôts en suivi</span></div>
     <div><strong>{ready?summary.following:"—"}</strong><span>Revendeurs suivis</span></div>
     <div><strong>{ready?summary.messages:"—"}</strong><span>Conversations</span></div>
     <div><strong>{ready?summary.appointments:"—"}</strong><span>Rendez-vous</span></div>
    </div>
    <h3 className="workspace-subtitle">Que souhaites-tu faire ?</h3>
    <div className="workspace-actions">
     <button type="button" onClick={()=>setTab("deposits")}><span aria-hidden="true">▣</span><strong>Proposer un vêtement</strong><small>Décrire une pièce et suivre sa demande.</small><span aria-hidden="true">↗</span></button>
     <button type="button" onClick={()=>setTab("community")}><span aria-hidden="true">♡</span><strong>Gérer mes échanges</strong><small>Retrouver mes messages, abonnements et rendez-vous.</small><span aria-hidden="true">↗</span></button>
     <Link href="/profils/"><span aria-hidden="true">✳</span><strong>Découvrir les profils</strong><small>Revendeurs et futurs services textiles à Rennes.</small><span aria-hidden="true">↗</span></Link>
    </div>
    <p className="workspace-footnote">Les fonctions de vente et de dépôt physique restent en préparation.</p>
   </>}
   {tab==="deposits"&&<><div className="workspace-welcome"><span className="section-kicker">DÉPÔT-VENTE</span><h2>Mes pièces, <em>à mon rythme.</em></h2><p>Propose un vêtement, puis retrouve ses étapes de traitement.</p></div><ConsignmentPanel/></>}
   {tab==="community"&&<><div className="workspace-welcome"><span className="section-kicker">COMMUNAUTÉ ET COMPTE</span><h2>Mes liens, <em>mes échanges.</em></h2><p>Gère ton profil, tes abonnements, tes messages et tes demandes de rendez-vous.</p></div><MemberDashboard/></>}
  </section>
 </div>
}
