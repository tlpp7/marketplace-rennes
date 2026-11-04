import nodemailer from "nodemailer";
import {getServerConfig} from "@/lib/config/env";
export async function sendAccountEmail(to:string,subject:string,actionUrl:string){
 const {mail}=getServerConfig();
 if(!mail.configured)throw Error("SMTP non configuré");
 const smtp=nodemailer.createTransport({host:mail.host,port:mail.port,secure:mail.secure,auth:{user:mail.username,pass:mail.password}});
 await smtp.sendMail({from:mail.from,to,subject,text:`Renn'Fripes : ${subject}\n\nOuvre ce lien : ${actionUrl}\n\nCe lien expire rapidement. Ignore ce message si tu n'as rien demandé.`});
}
