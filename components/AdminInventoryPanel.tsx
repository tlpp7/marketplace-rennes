"use client";
import {useCallback,useEffect,useState} from "react";
type Item={
 id:string;sku:string;state:string;location_code:string;title:string;deposant:string;
 list_price_cents:number;commission_bps:number;receipt_reference:string|null;
 quality_verdict:"passed"|"rejected"|null;mandate_accepted:boolean;public_photo_url:string|null;
};
type Draft={proofReference:string;location:string;notes:string;physicallyReceived:boolean;
 verdict:"passed"|"rejected";labelMatches:boolean;clean:boolean;conditionMatches:boolean;
 photoVerified:boolean;size:string;photoUrl:string;description:string};
const blank:Draft={proofReference:"",location:"",notes:"",physicallyReceived:false,
 verdict:"passed",labelMatches:false,clean:false,conditionMatches:false,
 photoVerified:false,size:"",photoUrl:"",description:""};
const possible:Record<string,string[]>={ready:["returned"],listed:["reserved","returned"],reserved:["listed","sold"]};
export default function AdminInventoryPanel(){
 const [items,setItems]=useState<Item[]>([]),[notice,setNotice]=useState(""),[loaded,setLoaded]=useState(false);
 const [active,setActive]=useState<string|null>(null),[draft,setDraft]=useState<Draft>(blank),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  try{
   const response=await fetch("/api/admin/inventory",{cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw Error(data.error??"Inventaire indisponible");
   setItems(data.items??[]);setLoaded(true);
  }catch(e){setNotice(e instanceof Error?e.message:"Inventaire indisponible")}
 },[]);
 useEffect(()=>{
  let cancelled=false;
  async function initial(){
   try{
    const response=await fetch("/api/admin/inventory",{cache:"no-store"});
    const data=await response.json();
    if(cancelled)return;
    if(!response.ok)throw Error(data.error??"Inventaire indisponible");
    setItems(data.items??[]);setLoaded(true);
   }catch(e){if(!cancelled)setNotice(e instanceof Error?e.message:"Inventaire indisponible")}
  }
  void initial();
  return ()=>{cancelled=true};
 },[]);
 function update<K extends keyof Draft>(key:K,value:Draft[K]){setDraft(v=>({...v,[key]:value}))}
 function open(item:Item,action:string){
  setActive(item.id+":"+action);setDraft({...blank,location:item.location_code});
  setNotice("");
 }
 async function operation(item:Item,action:"receive"|"quality"|"publish"){
  let payload:Record<string,unknown>={action};
  if(action==="receive")payload={...payload,proofReference:draft.proofReference,location:draft.location,notes:draft.notes,physicallyReceived:draft.physicallyReceived};
  if(action==="quality")payload={...payload,verdict:draft.verdict,notes:draft.notes,checks:{labelMatches:draft.labelMatches,clean:draft.clean,conditionMatches:draft.conditionMatches,photoVerified:draft.photoVerified}};
  if(action==="publish")payload={...payload,size:draft.size,photoUrl:draft.photoUrl,description:draft.description};
  setBusy(true);
  try{
   const response=await fetch("/api/admin/inventory/"+item.id+"/operations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const data=await response.json();
   if(!response.ok)throw Error(data.error??"Opération refusée");
   setNotice("Enregistré : "+data.notice);setActive(null);setDraft(blank);await load();
  }catch(e){setNotice(e instanceof Error?e.message:"Erreur")}finally{setBusy(false)}
 }
 async function transition(item:Item,state:string){
  const location=window.prompt("Emplacement du vêtement",item.location_code);
  if(location===null)return;
  setBusy(true);
  try{
   const response=await fetch("/api/admin/inventory/"+item.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({state,location})});
   const data=await response.json();
   if(!response.ok)throw Error(data.error??"Transition impossible");
   setNotice("Stock mis à jour");await load();
  }catch(e){setNotice(e instanceof Error?e.message:"Erreur")}finally{setBusy(false)}
 }
 return <section className="admin-consignments">
  <h2>Réception, qualité, mandat et publication</h2>
  <p>Chaque article suit les étapes dans l’ordre. La publication est verrouillée tant que les preuves ne sont pas réunies.</p>
  <p role="status" aria-live="polite">{notice}</p>
  {loaded&&(!items.length?<p>Aucun vêtement accepté.</p>:items.map(item=>{
   const action=item.state==="intake"?"receive":item.state==="quality_check"?"quality":item.state==="ready"?"publish":null;
   const editing=action!==null&&active===item.id+":"+action;
   return <article className="admin-item" key={item.id}>
    <div>
     <strong>{item.sku} · {item.title}</strong>
     <p>@{item.deposant} · {item.state} · emplacement : {item.location_code||"non renseigné"}</p>
     <small>Commission {(item.commission_bps/100).toFixed(2)} % · prix {(item.list_price_cents/100).toFixed(2)} €</small>
     <p className="product-secondary">Réception : {item.receipt_reference??"manquante"} · Qualité : {item.quality_verdict??"à réaliser"} · Mandat : {item.mandate_accepted?"accepté":"en attente"}</p>
     {item.public_photo_url&&<p className="product-secondary">Photo publique enregistrée.</p>}
     {item.state==="intake"&&!item.mandate_accepted&&<p className="demo-note">Réception bloquée : attendre le consentement au mandat du déposant.</p>}
     {editing&&action&&<form className="consignment-form" onSubmit={e=>{e.preventDefault();void operation(item,action)}}>
      {action==="receive"&&<>
       <label>Référence de bordereau<input required minLength={4} maxLength={80} value={draft.proofReference} onChange={e=>update("proofReference",e.target.value)}/></label>
       <label>Emplacement physique<input required minLength={2} maxLength={48} value={draft.location} onChange={e=>update("location",e.target.value)}/></label>
       <label>Notes de réception<textarea maxLength={1000} value={draft.notes} onChange={e=>update("notes",e.target.value)}/></label>
       <label><input type="checkbox" required checked={draft.physicallyReceived} onChange={e=>update("physicallyReceived",e.target.checked)}/> J’atteste avoir réellement reçu cet article.</label>
      </>}
      {action==="quality"&&<>
       <label>Décision<select value={draft.verdict} onChange={e=>update("verdict",e.target.value as "passed"|"rejected")}><option value="passed">Contrôle accepté</option><option value="rejected">Contrôle refusé</option></select></label>
       {([["labelMatches","Étiquette et article concordants"],["clean","Article propre"],["conditionMatches","État conforme à la description"],["photoVerified","Photographies vérifiées"]] as const).map(([key,label])=><label key={key}><input type="checkbox" checked={draft[key]} onChange={e=>update(key,e.target.checked)}/> {label}</label>)}
       <label>Compte-rendu et motif de refus<textarea maxLength={1000} value={draft.notes} onChange={e=>update("notes",e.target.value)}/></label>
      </>}
      {action==="publish"&&<>
       {!item.mandate_accepted&&<p className="demo-note">Publication impossible : le déposant doit accepter le mandat depuis « Mon espace ».</p>}
       <label>Taille réelle<input required maxLength={40} value={draft.size} onChange={e=>update("size",e.target.value)} placeholder="M"/></label>
       <label>URL HTTPS de la photographie<input required type="text" maxLength={1000} value={draft.photoUrl} onChange={e=>update("photoUrl",e.target.value)} placeholder="https://.../veste.jpg"/></label>
       <label>Description publique<textarea required minLength={20} maxLength={1500} value={draft.description} onChange={e=>update("description",e.target.value)}/></label>
       <p className="product-secondary">L’hôte de la photo doit être autorisé dans CONSIGNMENT_MEDIA_HOSTS. Aucun paiement n’est déclenché ici.</p>
      </>}
      <div className="admin-actions">
       <button type="submit" disabled={busy||(action==="publish"&&!item.mandate_accepted)}>{busy?"Enregistrement…":"Enregistrer l’étape"}</button>
       <button type="button" disabled={busy} onClick={()=>setActive(null)}>Annuler</button>
      </div>
     </form>}
    </div>
    <div className="admin-actions">
     {action&&!editing&&<button type="button" disabled={busy||(action==="receive"&&!item.mandate_accepted)} onClick={()=>open(item,action)}>{action==="receive"?"Réceptionner":action==="quality"?"Contrôler":"Publier"}</button>}
     {(possible[item.state]??[]).map(state=><button key={state} disabled={busy} type="button" onClick={()=>void transition(item,state)}>{state==="returned"?"Retourner":state==="reserved"?"Réserver":state==="listed"?"Remettre en vente":"Marquer vendu"}</button>)}
    </div>
   </article>
  }))}
 </section>;
}
