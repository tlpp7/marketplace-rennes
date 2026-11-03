import nodemailer from "nodemailer";
export async function sendAccountEmail(to:string,subject:string,actionUrl:string){
 const host=process.env.SMTP_HOST,username=process.env.SMTP_USER,password=process.env.SMTP_PASSWORD,from=process.env.SMTP_FROM;
 if(!host||!username||!password||!from)throw Error("SMTP non configuré");
 const smtp=nodemailer.createTransport({host,port:Number(process.env.SMTP_PORT??465),secure:process.env.SMTP_SECURE!=="false",auth:{user:username,pass:password}});
 await smtp.sendMail({from,to,subject,text:`Renn'Fripes : ${subject}\n\nOuvre ce lien : ${actionUrl}\n\nCe lien expire rapidement. Ignore ce message si tu n'as rien demandé.`});
}
