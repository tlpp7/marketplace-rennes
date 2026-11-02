import data from "@/data/profiles.json";
import type {Profile,ProfileKind} from "./types";
export const getProfiles=():Profile[]=>data as Profile[];
export const getProfilesByKind=(kind:ProfileKind)=>getProfiles().filter(p=>p.kind===kind);
export const getProfileBySlug=(slug:string)=>getProfiles().find(p=>p.slug===slug);
