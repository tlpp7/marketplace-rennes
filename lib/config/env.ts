/**
 * Renn'Fripes server-side configuration.
 * No secrets are exported to Client Components. Do not add NEXT_PUBLIC_ secrets.
 * Read env at call time so local tests and Railway variables have the same semantics.
 */
type Environment = NodeJS.ProcessEnv;
const value=(env:Environment,name:string)=>env[name]?.trim()??"";
function flag(env:Environment,name:string){const v=value(env,name);if(v&&v!=="true"&&v!=="false")throw Error(name+" must be true or false");return v==="true"}
function port(env:Environment,name:string,fallback:number){const raw=value(env,name);if(!raw)return fallback;const n=Number(raw);if(!Number.isSafeInteger(n)||n<1||n>65535)throw Error(name+" must be a valid port");return n}
function url(env:Environment,name:string,required=false,allowLocal=false){
 const raw=value(env,name);if(!raw){if(required)throw Error(name+" is required");return undefined}
 let parsed:URL;try{parsed=new URL(raw)}catch{throw Error(name+" must be a valid URL")}
 if(parsed.username||parsed.password||parsed.search||parsed.hash||parsed.pathname!=="/")throw Error(name+" must be an origin without credentials, path or query");
 const local=allowLocal&&["localhost","127.0.0.1","[::1]"].includes(parsed.hostname);
 if(parsed.protocol!=="https:"&&!(local&&parsed.protocol==="http:"))throw Error(name+" must use HTTPS");
 return parsed.origin;
}
function requiredSecret(env:Environment,name:string,min=1){const v=value(env,name);if(v.length<min)throw Error(name+" is missing or too short");return v}
function storage(env:Environment,prefix:string){
 const endpointName=prefix+"ENDPOINT",bucketName=prefix+"BUCKET",regionName=prefix+"REGION",keyName=prefix+"ACCESS_KEY_ID",secretName=prefix+"SECRET_ACCESS_KEY";
 const present=[endpointName,bucketName,regionName,keyName,secretName].some(k=>Boolean(value(env,k)));
 if(!present)return {configured:false as const};
 const endpoint=url(env,endpointName,true);
 return {configured:true as const,endpoint:endpoint!,bucket:requiredSecret(env,bucketName),region:requiredSecret(env,regionName),
  accessKeyId:requiredSecret(env,keyName),secretAccessKey:requiredSecret(env,secretName)};
}
export function getServerConfig(env:Environment=process.env){
 const production=value(env,"NODE_ENV")==="production";
 const accountsEnabled=flag(env,"ACCOUNTS_ENABLED"),ordersEnabled=flag(env,"ORDERS_ENABLED"),seoPublic=flag(env,"SEO_PUBLIC");
 const allowUnverifiedLocal=flag(env,"ALLOW_UNVERIFIED_LOCAL");
 const smtpHost=value(env,"SMTP_HOST");
 const smtpPort=port(env,"SMTP_PORT",465),smtpSecure=value(env,"SMTP_SECURE")!=="false";
 if(value(env,"SMTP_SECURE")&&!["true","false"].includes(value(env,"SMTP_SECURE")))throw Error("SMTP_SECURE must be true or false");
 const mail={host:smtpHost,port:smtpPort,secure:smtpSecure,username:value(env,"SMTP_USER"),password:value(env,"SMTP_PASSWORD"),from:value(env,"SMTP_FROM")};
 const mailConfigured=Boolean(mail.host&&mail.username&&mail.password&&mail.from);
 const appOrigin=url(env,"APP_ORIGIN",false,!production);
 const siteOrigin=url(env,"NEXT_PUBLIC_SITE_URL",false,!production);
 const sessionSecret=value(env,"SESSION_SECRET");
 const databaseUrl=value(env,"DATABASE_URL");
 const mediaHosts=value(env,"CONSIGNMENT_MEDIA_HOSTS").split(",").map(v=>v.trim().toLowerCase()).filter(Boolean);
 if(mediaHosts.some(host=>!/^[a-z0-9.-]+$/.test(host)||host.startsWith(".")||host.endsWith(".")))throw Error("CONSIGNMENT_MEDIA_HOSTS invalid");
 return {
  production,role:value(env,"RF_DEPLOY_ROLE")||"unspecified",
  flags:{accountsEnabled,ordersEnabled,seoPublic,allowUnverifiedLocal},
  database:{url:databaseUrl,ssl:flag(env,"PGSSL"),maxConnections:port(env,"PGPOOL_MAX",5)},
  session:{secret:sessionSecret},
  urls:{appOrigin,siteOrigin},
  mail:{...mail,configured:mailConfigured},
  media:{allowedHosts:mediaHosts,storage:storage(env,"S3_")},
  documents:{storage:storage(env,"DOCUMENTS_S3_")},
  mandate:{name:value(env,"CONSIGNMENT_OPERATOR_NAME"),address:value(env,"CONSIGNMENT_OPERATOR_ADDRESS"),
   siret:value(env,"CONSIGNMENT_OPERATOR_SIRET"),version:value(env,"CONSIGNMENT_TERMS_VERSION"),terms:value(env,"CONSIGNMENT_TERMS_TEXT")},
 };
}
/** Explicit operational gate; never executed during Next.js static generation. */
export function validateDeploymentConfig(env:Environment=process.env){
 const config=getServerConfig(env);
 if(!config.database.url)throw Error("DATABASE_URL is required at runtime");
 try{const dbUrl=new URL(config.database.url);if(!["postgres:","postgresql:"].includes(dbUrl.protocol))throw Error("invalid")}catch{throw Error("DATABASE_URL must be a PostgreSQL URL")}
 if(config.session.secret.length<32)throw Error("SESSION_SECRET must have at least 32 characters");
 if(config.production){
  if(!config.urls.appOrigin||!config.urls.siteOrigin)throw Error("APP_ORIGIN and NEXT_PUBLIC_SITE_URL required in production");
  if(config.urls.appOrigin!==config.urls.siteOrigin)throw Error("APP_ORIGIN and NEXT_PUBLIC_SITE_URL must match");
  if(config.flags.allowUnverifiedLocal)throw Error("ALLOW_UNVERIFIED_LOCAL is forbidden in production");
  if(config.flags.ordersEnabled)throw Error("ORDERS_ENABLED cannot be activated before verified payment integration");
  if(config.flags.accountsEnabled&&!config.mail.configured)throw Error("SMTP is required when public accounts are enabled");
 }
 if(config.flags.seoPublic&&(!config.urls.siteOrigin||!config.flags.accountsEnabled))throw Error("SEO_PUBLIC requires public URL and open accounts");
 return config;
}
