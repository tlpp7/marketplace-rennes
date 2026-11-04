import {readFile} from "node:fs/promises";
import ts from "typescript";
const file=new URL("../lib/config/env.ts",import.meta.url);
const source=await readFile(file,"utf8");
const transpiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {validateDeploymentConfig}=await import("data:text/javascript;base64,"+Buffer.from(transpiled).toString("base64"));
try{
 const config=validateDeploymentConfig();
 console.log("Configuration OK",{role:config.role,production:config.production,accountsEnabled:config.flags.accountsEnabled,
 ordersEnabled:config.flags.ordersEnabled,seoPublic:config.flags.seoPublic,mailConfigured:config.mail.configured,
 mediaBucketConfigured:config.media.storage.configured,documentsBucketConfigured:config.documents.storage.configured});
}catch(error){
 console.error("Configuration refused:",error instanceof Error?error.message:"invalid settings");
 process.exitCode=1;
}
