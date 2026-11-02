/** Integer-based calculations prevent currency floating-point drift. */
export function calculateConsignment(priceCents:number,commissionBps:number,processingCents=0){
 if(!Number.isSafeInteger(priceCents)||priceCents<0||!Number.isSafeInteger(commissionBps)||commissionBps<0||commissionBps>10000||!Number.isSafeInteger(processingCents)||processingCents<0)throw Error("Invalid price or commission");
 const commissionCents=Math.round(priceCents*commissionBps/10000);
 return {priceCents,commissionCents,payoutCents:priceCents-commissionCents,contributionCents:commissionCents-processingCents};
}
