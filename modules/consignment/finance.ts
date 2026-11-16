/**
 * Economic invariants for consignment.
 * Prices and fees are non-negative, integer cents; commissions are basis points.
 * Calculation uses bigint internally so multiplication cannot lose precision.
 */
export function calculateConsignment(priceCents:number,commissionBps:number,processingCents=0){
 if(!Number.isSafeInteger(priceCents)||priceCents<0||
    !Number.isSafeInteger(commissionBps)||commissionBps<0||commissionBps>10000||
    !Number.isSafeInteger(processingCents)||processingCents<0)
  throw Error("Invalid price or commission");
 const price=BigInt(priceCents),bps=BigInt(commissionBps);
 // Positive half-up rounding: agrees with Math.round on small positive amounts.
 const commissionCents=Number((price*bps+5000n)/10000n);
 const payoutCents=priceCents-commissionCents;
 const contributionCents=commissionCents-processingCents;
 return {priceCents,commissionCents,payoutCents,contributionCents};
}
