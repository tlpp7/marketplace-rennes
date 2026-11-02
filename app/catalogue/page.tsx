import type {Metadata} from "next";
import ProductCard from "@/components/ProductCard";
import {getProducts} from "@/modules/catalog/repository";
export const metadata:Metadata={title:"Catalogue de vêtements d’occasion"};
export default function Catalogue(){return <main className="wrap"><h1>Catalogue de vêtements d’occasion</h1><p className="notice">Catalogue fictif pour le développement. Aucun article actuellement en vente.</p><div className="grid">{getProducts().map(p=><ProductCard key={p.id} product={p}/>)}</div></main>}
