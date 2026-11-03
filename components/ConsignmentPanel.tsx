"use client";
import {useEffect,useState} from "react";
type RequestItem={id:string;title:string;status:string;estimated_price_cents:number;created_at:string};
export default function ConsignmentPanel(){
 const [items,setItems]=useState<RequestItem[]>([]),[title,setTitle]=useState(""),[brand,setBrand]=useState(""),[category,setCategory]=useState("vestes"),[condition,setCondition]=useState("good"),[price,setPrice]=useState("35"),[notes,setNotes]=useState(""),[message,setMessage]=useState("");
 async function load(){try{const r=await fetch("/api/consignments",{cache:"no-store"});const j=await r.json();if(r.ok)setItems(j.requests??[])}catch{}}
 useEffect(() => {
      let cancelled = false;

      async function loadInitial() {
        try {
          const r = await fetch("/api/consignments", {
          cache: "no-store"
        });
        if (!r.ok) return;
        const j = await r.json();
        if (!cancelled) setItems(j.requests ?? []);
        } catch {
          /* Échec du chargement initial. */
        }
      }

      void loadInitial();

      return () => {
        cancelled = true;
      };
    }, []);
 async function submit(e:React.FormEvent){e.preventDefault();try{const cents=Math.round(Number(price)*100);const r=await fetch("/api/consignments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,brand,category,condition,notes,estimatedPriceCents:cents})});const j=await r.json();if(!r.ok)throw Error(j.error??"Erreur");setTitle("");setNotes("");setMessage("Demande enregistrée, sans confirmation de dépôt physique.");await load()}catch(e){setMessage(e instanceof Error?e.message:"Erreur")}}
 async function withdraw(id:string){const r=await fetch("/api/consignments/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"withdraw"})});if(r.ok)await load();else setMessage("Retrait impossible")}
 return <section className="consignment-panel"><h2>Mes dépôts de vêtements</h2><p>Propose un article pour évaluation. Aucun vêtement ne doit être envoyé avant acceptation et contractualisation.</p><form onSubmit={submit} className="consignment-form"><label>Vêtement<input value={title} onChange={e=>setTitle(e.target.value)} minLength={4} maxLength={160} required placeholder="Veste en jean bleue"/></label><label>Marque<input value={brand} onChange={e=>setBrand(e.target.value)} maxLength={80}/></label><label>Catégorie<select value={category} onChange={e=>setCategory(e.target.value)}><option value="vestes">Vestes</option><option value="jeans">Jeans</option><option value="robes">Robes</option><option value="chemises">Chemises</option><option value="autres">Autres</option></select></label><label>État<select value={condition} onChange={e=>setCondition(e.target.value)}><option value="new">Neuf</option><option value="very_good">Très bon</option><option value="good">Bon</option><option value="fair">Correct</option></select></label><label>Prix estimé (€)<input type="number" min="0" max="100000" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} required/></label><label>Détails<textarea maxLength={1000} value={notes} onChange={e=>setNotes(e.target.value)}/></label><button className="button button-dark" type="submit">Proposer mon vêtement ↗</button></form><p role="status">{message}</p><h3>Suivi des demandes</h3><div className="consignment-rows">{items.length?items.map(i=><div key={i.id} className="consignment-row"><div><strong>{i.title}</strong><p>{(i.estimated_price_cents/100).toLocaleString("fr-FR",{style:"currency",currency:"EUR"})} · {i.status}</p></div>{i.status==="submitted"&&<button type="button" onClick={()=>void withdraw(i.id)}>Retirer</button>}</div>):<p>Aucune demande enregistrée.</p>}</div></section>
}
