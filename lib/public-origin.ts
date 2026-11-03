export function publicOrigin(request:Request){
 const configured=process.env.APP_ORIGIN?.trim();
 if(configured){const url=new URL(configured);if(url.protocol!=="https:"&&!(process.env.NODE_ENV!=="production"&&url.hostname==="127.0.0.1"))throw Error("APP_ORIGIN must be HTTPS");return url.origin}
 if(process.env.NODE_ENV==="production")throw Error("APP_ORIGIN required in production");
 const url=new URL(request.url);if(!["127.0.0.1","localhost"].includes(url.hostname))throw Error("APP_ORIGIN required outside localhost");return url.origin;
}
