import type {MetadataRoute} from "next";
import {getProducts} from "@/modules/catalog/repository";
import {site,isLive} from "@/lib/site";
export default function sitemap():MetadataRoute.Sitemap{if(!isLive)return [];return ["","/catalogue/","/depot-vente/rennes/",...getProducts().filter(p=>!p.demo&&p.status==="available").map(p=>`/produit/${p.slug}/`)].map(p=>({url:`${site.url}${p}`}))}
