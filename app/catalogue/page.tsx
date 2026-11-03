import type {Metadata} from "next";
import CatalogueClient from "@/components/CatalogueClient";
import {getProducts} from "@/modules/catalog/repository";
import {getLiveProducts} from "@/modules/catalog/live";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Vêtements d'occasion à Rennes",description:"Découvrez les pièces de seconde main disponibles chez Renn'Fripes à Rennes."};
export default async function Catalogue(){
 let live=[] as Awaited<ReturnType<typeof getLiveProducts>>;
 let unavailable=false;
 try{live=await getLiveProducts()}catch{unavailable=true}
 return <main className="shell catalog-page">
  <div className="catalog-intro"><span className="section-kicker">RENN’FRIPES / LE VESTIAIRE</span><h1>Chiner, c’est <em>trouver.</em></h1><p>Des pièces singulières, des envies nouvelles. Les articles portant la mention « démo » ne sont pas commercialisés.</p></div>
  {unavailable&&<p className="demo-note" role="status">Le stock en temps réel est temporairement indisponible. Les exemples affichés ne peuvent pas être achetés.</p>}
  <CatalogueClient products={[...live,...getProducts()]} liveCount={live.length}/>
 </main>;
}
