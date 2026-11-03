import {createHash} from "node:crypto";
type Item={sku:string;title:string;list_price_cents:number;commission_bps:number};
export function mandateConfig(){
 const name=process.env.CONSIGNMENT_OPERATOR_NAME?.trim()??"";
 const address=process.env.CONSIGNMENT_OPERATOR_ADDRESS?.trim()??"";
 const siret=process.env.CONSIGNMENT_OPERATOR_SIRET?.trim()??"";
 const version=process.env.CONSIGNMENT_TERMS_VERSION?.trim()??"";
 const terms=process.env.CONSIGNMENT_TERMS_TEXT?.trim()??"";
 if(!name||!address||!(/^\d{14}$/.test(siret))||!version||terms.length<40)
  throw Error("Mandat indisponible : identité de l'exploitant ou conditions manquantes");
 return {name,address,siret,version,terms};
}
export function mandatePreview(item:Item){
 const c=mandateConfig();
 const price=(Number(item.list_price_cents)/100).toFixed(2);
 const commission=(Number(item.commission_bps)/100).toFixed(2);
 return {
  version:c.version,
  text:[
   "MANDAT DE DÉPÔT-VENTE — RENN’FRIPES",
   "Exploitant : "+c.name+" — SIRET "+c.siret,
   "Adresse de l'exploitant : "+c.address,
   "Article : "+item.title+" — Référence "+item.sku,
   "Prix affiché : "+price+" EUR TTC (à confirmer selon le régime applicable).",
   "Commission prévue : "+commission+" % du prix, soit "+(Number(item.list_price_cents)*Number(item.commission_bps)/1000000).toFixed(2)+" EUR à ce prix.",
   "Version des conditions : "+c.version,
   "",
   c.terms
  ].join("\n"),
  sha256:""
 };
}
export function finalizedMandate(item:Item,depositorName:string,depositorAddress:string){
 const preview=mandatePreview(item);
 const document=[
  preview.text,
  "",
  "Déposant : "+depositorName,
  "Adresse du déposant : "+depositorAddress,
  "Le déposant reconnaît avoir lu les conditions et accepte ce mandat par validation explicite sur son compte."
 ].join("\n");
 return {version:preview.version,document,sha256:createHash("sha256").update(document,"utf8").digest("hex")};
}
