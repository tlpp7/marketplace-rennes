import {createHash,timingSafeEqual} from "node:crypto";
/** Integrity fingerprint; NOT a signature or proof of document authorship. */
export function evidenceSha256(document:string):string{
 return createHash("sha256").update(document,"utf8").digest("hex");
}
export function verifyEvidenceSha256(document:string,digest:string):boolean{
 if(!/^[a-f0-9]{64}$/.test(digest))return false;
 const actual=Buffer.from(evidenceSha256(document),"hex");
 const expected=Buffer.from(digest,"hex");
 return timingSafeEqual(actual,expected);
}
