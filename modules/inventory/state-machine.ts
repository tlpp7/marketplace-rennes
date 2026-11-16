/**
 * V0.5.1 domain transition model (no payment integration).
 * The DB trigger remains the ultimate authority for persisted transitions.
 * sold is intentionally unreachable until a signed, idempotent PSP flow exists.
 */
export const INVENTORY_STATES=["intake","quality_check","ready","listed","reserved","sold","returned"] as const;
export type InventoryState=(typeof INVENTORY_STATES)[number];
export type WorkflowAction="receive"|"quality"|"publish";
export type QualityVerdict="passed"|"rejected";
const ADMIN_TRANSITIONS:Readonly<Record<InventoryState,readonly InventoryState[]>>={
 intake:[],quality_check:[],ready:["returned"],listed:["reserved","returned"],
 reserved:["listed"],sold:[],returned:[]
};
const WORKFLOW_STATES:Readonly<Record<WorkflowAction,InventoryState>>={
 receive:"intake",quality:"quality_check",publish:"ready"
};
export function isInventoryState(state:string):state is InventoryState{
 return (INVENTORY_STATES as readonly string[]).includes(state);
}
export function allowedAdminTransition(from:string,to:string):boolean{
 return isInventoryState(from)&&isInventoryState(to)&&ADMIN_TRANSITIONS[from].includes(to);
}
export function allowedWorkflowAction(action:string,from:string):boolean{
 return Object.hasOwn(WORKFLOW_STATES,action)&&
  WORKFLOW_STATES[action as WorkflowAction]===from;
}
/** Each archived proof is unique per SKU in PostgreSQL (item_id PRIMARY KEY). */
export type PublicationEvidence={receiptCount:number;positiveQualityCount:number;mandateCount:number};
export function hasPublicationEvidence(e:PublicationEvidence):boolean{
 return [e.receiptCount,e.positiveQualityCount,e.mandateCount].every(n=>Number.isInteger(n)&&n===1);
}
export function canShowInCatalog(state:string,e:PublicationEvidence,publicationCount:number):boolean{
 return state==="listed"&&hasPublicationEvidence(e)&&publicationCount===1;
}
