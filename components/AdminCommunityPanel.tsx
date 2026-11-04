"use client";import {useEffect,useState} from "react";
type Profile={user_id:string;handle:string;kind:string;city:string;approved:boolean};
type Review={id:string;author:string;subject:string;rating:number;body:string;visibility:string};
export default function AdminCommunityPanel(){const [profiles,setProfiles]=useState<Profile[]>([]),[reviews,setReviews]=useState<Review[]>([]),[notice,setNotice]=useState("");
async function refresh(){try{const [p,r]=await Promise.all([fetch("/api/admin/profiles"),fetch("/api/admin/reviews")]);if(p.ok)setProfiles((await p.json()).profiles);if(r.ok)setReviews((await r.json()).reviews)}catch{setNotice("Données indisponibles")}}
useEffect(() => {
      let cancelled = false;

      async function loadInitial() {
        try {
          const [p, r] = await Promise.all([
          fetch("/api/admin/profiles"),
          fetch("/api/admin/reviews")
        ]);
        if (cancelled) return;
        if (p.ok) setProfiles((await p.json()).profiles);
        if (r.ok) setReviews((await r.json()).reviews);
        } catch {
          if (!cancelled) setNotice("Données indisponibles");
        }
      }

      void loadInitial();

      return () => {
        cancelled = true;
      };
    }, []);
async function patch(url:string,value:object){const r=await fetch(url,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(value)});if(!r.ok){setNotice((await r.json()).error??"Erreur");return}setNotice("Modification enregistrée");await refresh()}
return <div className="admin-consignments"><h2>Modération des membres</h2><p role="status">{notice}</p><h3>Profils revendeur et prestataire</h3>{profiles.length?profiles.map(p=><article className="admin-item" key={p.user_id}><div><strong>@{p.handle} · {p.kind}</strong><p>{p.city} · {p.approved?"Approuvé":"À examiner"}</p></div><div className="admin-actions"><button onClick={()=>void patch("/api/admin/profiles/"+p.user_id,{approved:!p.approved})}>{p.approved?"Suspendre":"Approuver"}</button></div></article>):<p>Aucun profil à modérer.</p>}<h3>Avis soumis à validation</h3>{reviews.filter(r=>r.visibility==="pending").map(r=><article className="admin-item" key={r.id}><div><strong>{r.rating}/5 · @{r.author} sur @{r.subject}</strong><p>{r.body}</p></div><div className="admin-actions"><button onClick={()=>void patch("/api/admin/reviews/"+r.id,{visibility:"published"})}>Publier</button><button onClick={()=>void patch("/api/admin/reviews/"+r.id,{visibility:"rejected"})}>Refuser</button></div></article>)}</div>}
