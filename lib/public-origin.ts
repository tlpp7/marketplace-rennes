import {getServerConfig} from "@/lib/config/env";
export function publicOrigin(request:Request){
 const config=getServerConfig();
 if(config.urls.appOrigin)return config.urls.appOrigin;
 if(config.production)throw Error("APP_ORIGIN required in production");
 const url=new URL(request.url);
 if(!["127.0.0.1","localhost","[::1]"].includes(url.hostname))throw Error("APP_ORIGIN required outside localhost");
 return url.origin;
}
