"use client";
import {useCallback,useEffect,useState} from "react";
type RequestItem={
 id:string;title:string;status:string;estimated_price_cents:number;created_at:string;
 sku:string|null;inventory_state:string|null;mandate_accepted:boolean;
 receipt_document:string|null;receipt_sha256:string|null;received_at:string|null;
 quality_verdict:string|null;published_at:string|null
};
type Mandate={
 accepted:boolean;preview?:string;version?:string;priceCents?:number;commissionBps?:number;
 mandate?:{document_text:string;document_sha256:string;accepted_at:string;terms_version:string}
};
export default function ConsignmentPanel(){
 const [items,setItems]=useState<RequestItem[]>([]);
 const [title,setTitle]=useState(""),[brand,setBrand]=useState(""),[category,setCategory]=useState("vestes"),
 [condition,setCondition]=useState("good"),[price,setPrice]=useState("35"),[notes,setNotes]=useState("");
 const [message,setMessage]=useState(""),[mandateId,setMandateId]=useState<string|null>(null),
 [mandate,setMandate]=useState<Mandate|null>(null),[legalName,setLegalName]=useState(""),
 [postalAddress,setPostalAddress]=useState(""),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  try{
   const r=await fetch("/api/consignments",{cache:"no-store"});
   if(!r.ok)return;
   const data=await r.json();setItems(data.requests??[]);
  }catch{setMessage("Liste des dépôts temporairement indisponible")}
 },[]);
 useEffect(()=>{void load()},[load]);
 async function submit(e:React.FormEvent){
  e.preventDefault();setBusy(true);
  try{
   const cents=Math.round(Number(price)*100);
   const r=await fetch("/api/consignments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,brand,category,condition,notes,estimatedPriceCents:cents})});
   const j=await r.json();if(!r.ok)throw Error(j.error??"Erreur");
   setTitle("");setNotes("");setMessage("Demande enregistrée : n’envoie aucun vêtement avant notre confirmation.");
   await load();
  }catch(e){setMessage(e instanceof Error?e.message:"Erreur")}finally{setBusy(false)}
 }
 async function withdraw(id:string){
  const r=await fetch("/api/consignments/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"withdraw"})});
  if(r.ok)await load();else setMessage("Retrait impossible");
 }
 async function openMandate(id:string){
  try{
   const r=await fetch("/api/consignments/"+id+"/mandate",{cache:"no-store"});
   const data=await r.json();if(!r.ok)throw Error(data.error??"Mandat indisponible");
   setMandateId(id);setMandate(data);setConsent(false);setLegalName("");setPostalAddress("");setMessage("");
  }catch(e){setMessage(e instanceof Error?e.message:"Impossible de lire le mandat")}
 }
 async function acceptMandate(e:React.FormEvent){
  e.preventDefault();
  if(!mandateId||!mandate||mandate.accepted||!consent)return;
  setBusy(true);
  try{
   const r=await fetch("/api/consignments/"+mandateId+"/mandate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    accept:true,depositorName:legalName,depositorAddress:postalAddress,
    version:mandate.version,priceCents:mandate.priceCents,commissionBps:mandate.commissionBps
   })});
   const data=await r.json();if(!r.ok)throw Error(data.error??"Acceptation refusée");
   setMessage("Mandat accepté et archivé. Empreinte SHA-256 : "+data.sha256);
   setMandate(null);setMandateId(null);setConsent(false);await load();
  }catch(e){setMessage(e instanceof Error?e.message:"Erreur")}finally{setBusy(false)}
 }
 return <section className="consignment-panel">
  <h2>Mes dépôts de vêtements</h2>
  <p>Propose une pièce pour évaluation. La réception physique nécessite une acceptation préalable et une attestation.</p>
  <form onSubmit={submit} className="consignment-form">
   <label>Vêtement<input value={title} onChange={e=>setTitle(e.target.value)} minLength={4} maxLength={160} required placeholder="Veste en jean bleue"/></label>
   <label>Marque<input value={brand} onChange={e=>setBrand(e.target.value)} maxLength={80}/></label>
   <label>Catégorie<select value={category} onChange={e=>setCategory(e.target.value)}><option value="vestes">Vestes</option><option value="jeans">Jeans</option><option value="robes">Robes</option><option value="chemises">Chemises</option><option value="autres">Autres</option></select></label>
   <label>État<select value={condition} onChange={e=>setCondition(e.target.value)}><option value="new">Neuf</option><option value="very_good">Très bon</option><option value="good">Bon</option><option value="fair">Correct</option></select></label>
   <label>Prix estimé (€)<input type="number" min="0" max="100000" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} required/></label>
   <label>Détails<textarea maxLength={1000} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
   <button className="button button-dark" type="submit" disabled={busy}>Proposer mon vêtement ↗</button>
  </form>
  <p role="status" aria-live="polite">{message}</p>
  <h3>Suivi de mes demandes</h3>
  <div className="consignment-rows">{items.length?items.map(i=><div key={i.id} className="consignment-row">
   <div>
    <strong>{i.title}</strong>
    <p>{(i.estimated_price_cents/100).toLocaleString("fr-FR",{style:"currency",currency:"EUR"})} · {i.status} {i.sku?" · "+i.sku:""}</p>
    {i.inventory_state&&<p className="product-secondary">Stock : {i.inventory_state} · Qualité : {i.quality_verdict??"en attente"} · Mandat : {i.mandate_accepted?"accepté":"non accepté"}</p>}
    {i.receipt_document&&<details><summary>Consulter mon attestation de réception</summary><pre className="mandate-document">{i.receipt_document}</pre><p>Empreinte SHA-256 : <code>{i.receipt_sha256}</code></p></details>}
    {i.published_at&&<a href="/catalogue/" className="text-link">Voir le catalogue</a>}
   </div>
   <div className="admin-actions">
    {i.status==="submitted"&&<button type="button" disabled={busy} onClick={()=>void withdraw(i.id)}>Retirer</button>}
    {i.status==="accepted"&&<button type="button" onClick={()=>void openMandate(i.id)}>{i.mandate_accepted?"Relire le mandat":"Lire et accepter le mandat"}</button>}
   </div>
  </div>):<p>Aucune demande enregistrée.</p>}</div>
  {mandateId&&mandate&&<section className="mandate-review">
   <h3>{mandate.accepted?"Mandat archivé":"Mandat à examiner et accepter"}</h3>
   <pre className="mandate-document">{mandate.accepted?mandate.mandate?.document_text:mandate.preview}</pre>
   {mandate.accepted?<p>Accepté le {mandate.mandate?.accepted_at?new Date(mandate.mandate.accepted_at).toLocaleString("fr-FR"):"—"} · SHA-256 : <code>{mandate.mandate?.document_sha256}</code></p>:
   <form onSubmit={acceptMandate} className="consignment-form">
    <label>Nom et prénom légaux du déposant<input required minLength={4} maxLength={160} autoComplete="name" value={legalName} onChange={e=>setLegalName(e.target.value)}/></label>
    <label>Adresse postale du déposant<textarea required minLength={8} maxLength={350} value={postalAddress} onChange={e=>setPostalAddress(e.target.value)}/></label>
    <label><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/> J’ai lu et j’accepte expressément la version des conditions et la commission indiquées ci-dessus.</label>
    <button className="button button-dark" type="submit" disabled={busy||!consent}>{busy?"Enregistrement…":"Accepter et archiver le mandat"}</button>
   </form>}
   <button type="button" className="button button-plain" onClick={()=>{setMandateId(null);setMandate(null)}}>Fermer</button>
  </section>}
 </section>;
}
