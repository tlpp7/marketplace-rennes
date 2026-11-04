"use client";
import {useEffect,useState} from "react";
type Item={id:string;title:string;deposant:string;status:string;sku?:string;inventory_state?:string;location_code?:string;estimated_price_cents:number};
export default function AdminConsignmentPanel(){
 const [rows,setRows]=useState<Item[]>([]),[notice,setNotice]=useState(""),[available,setAvailable]=useState(false);
 async function refresh(){try{const r=await fetch("/api/admin/consignments",{cache:"no-store"});if(!r.ok){setAvailable(false);return}const j=await r.json();setRows(j.requests??[]);setAvailable(true)}catch{setAvailable(false)}}
 useEffect(() => {
      let cancelled = false;

      async function loadInitial() {
        try {
          const r = await fetch("/api/admin/consignments", {
          cache: "no-store"
        });
        if (cancelled) return;
        if (!r.ok) {
          setAvailable(false);
          return;
        }
        const j = await r.json();
        if (!cancelled) {
          setRows(j.requests ?? []);
          setAvailable(true);
        }
        } catch {
          if (!cancelled) setAvailable(false);
        }
      }

      void loadInitial();

      return () => {
        cancelled = true;
      };
    }, []);
 async function action(id:string,kind:string){let commissionBps:number|undefined;if(kind==="accept"){const answer=window.prompt("Commission en % (ex. 35)","35");if(answer===null)return;const p=Number(answer);if(!Number.isFinite(p)||p<0||p>100){setNotice("Commission incorrecte");return}commissionBps=Math.round(p*100)}try{const r=await fetch("/api/admin/consignments/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:kind,commissionBps})});const j=await r.json();if(!r.ok)throw Error(j.error);setNotice("Action enregistrée");await refresh()}catch(e){setNotice(e instanceof Error?e.message:"Erreur")}}
 if(!available)return <p className="demo-note">Administration accessible uniquement aux utilisateurs habilités.</p>;
 return <section className="admin-consignments"><h2>Dépôts à traiter</h2><p role="status">{notice}</p>{rows.length?rows.map(i=><article key={i.id} className="admin-item"><div><strong>{i.title}</strong><p>@{i.deposant} · {(i.estimated_price_cents/100).toFixed(2)} € · {i.status}</p><small>{i.sku?i.sku+" — "+i.inventory_state:"Inventaire non créé"}</small></div><div className="admin-actions">{i.status==="submitted"&&<button type="button" onClick={()=>void action(i.id,"review")}>Examiner</button>}{i.status==="reviewing"&&<><button type="button" onClick={()=>void action(i.id,"accept")}>Accepter</button><button type="button" onClick={()=>void action(i.id,"decline")}>Refuser</button></>}</div></article>):<p>Aucune demande.</p>}</section>
}
