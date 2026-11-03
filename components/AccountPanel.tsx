"use client";
import Link from "next/link";
import {useState} from "react";
type Mode="register"|"login";
export default function AccountPanel(){
 const [mode,setMode]=useState<Mode>("register"),[handle,setHandle]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[notice,setNotice]=useState(""),[pending,setPending]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setPending(true);setNotice("");try{
 const r=await fetch("/api/auth/"+mode,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({handle,email,password})});
 const j=await r.json();if(!r.ok)throw Error(j.error??"Une erreur est survenue");
 if(j.verificationRequired){setNotice("Un lien de confirmation a été envoyé. Vérifie ta boîte mail avant de te connecter.");setMode("login");return}
 window.location.assign("/mon-espace/");
 }catch(e){setNotice(e instanceof Error?e.message:"Erreur inconnue")}finally{setPending(false)}}
 return <div className="account-panel"><div className="account-switch"><button type="button" aria-pressed={mode==="register"} onClick={()=>setMode("register")}>Créer un compte</button><button type="button" aria-pressed={mode==="login"} onClick={()=>setMode("login")}>Se connecter</button></div><form onSubmit={submit}><h2>{mode==="register"?"Rejoins le vestiaire":"Bienvenue de retour"}</h2>{mode==="register"&&<label>Identifiant<input autoComplete="username" minLength={3} maxLength={40} required value={handle} onChange={e=>setHandle(e.target.value)} placeholder="identifiant_public"/></label>}<label>Adresse email<input autoComplete="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="bonjour@exemple.fr"/></label><label>Mot de passe<input autoComplete={mode==="register"?"new-password":"current-password"} type="password" required minLength={mode==="register"?12:1} value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={pending} className="button button-dark" type="submit">{pending?"Traitement…":mode==="register"?"Créer mon compte":"Me connecter"} →</button><p aria-live="polite" className="form-message">{notice}</p>{mode==="login"&&<Link href="/mot-de-passe/">Mot de passe oublié ?</Link>}</form></div>
}