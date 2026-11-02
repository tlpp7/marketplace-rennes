import {calculateConsignment} from "@/modules/consignment/finance";
export type OrderQuote={priceCents:number;commissionCents:number;depositorPayoutCents:number;handlingContributionCents:number};
export function quoteOrder(priceCents:number,commissionBps:number,handlingCents:number):OrderQuote{const r=calculateConsignment(priceCents,commissionBps,handlingCents);return {priceCents:r.priceCents,commissionCents:r.commissionCents,depositorPayoutCents:r.payoutCents,handlingContributionCents:r.contributionCents}}
