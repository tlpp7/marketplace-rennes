export type ProfileKind = "reseller" | "care";
export type Profile = {id:string;slug:string;name:string;kind:ProfileKind;headline:string;description:string;city:string;specialties:string[];services:string[];demo:boolean;verified:boolean;};
