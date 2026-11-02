import type { Metadata } from "next";
import CatalogueClient from "@/components/CatalogueClient";
import {getProducts} from "@/modules/catalog/repository";
export const metadata: Metadata = {title:"Chiner des vêtements d'occasion à Rennes",description:"Découvrez le catalogue de démonstration Renn'Fripes, futur vestiaire de seconde main à Rennes."};
export default function Catalogue(){return <main className="shell catalog-page"><div className="catalog-intro"><span className="section-kicker">RENN’FRIPES / LE VESTIAIRE</span><h1>Chiner, c’est <em>trouver.</em></h1><p>Des pièces singulières, des envies nouvelles. Pour le moment, notre collection est une démonstration.</p></div><CatalogueClient products={getProducts()}/></main>}
