import type {MetadataRoute} from "next";
import {site,isLive} from "@/lib/site";
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:"*",...(isLive?{allow:"/"}:{disallow:"/"})},...(isLive?{sitemap:`${site.url}/sitemap.xml`}:{})}}
