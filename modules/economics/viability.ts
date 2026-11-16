/**
 * Pure unit-economics model: all inputs and outputs are integer cents.
 * Figures are scenario assumptions, NOT a financial forecast.
 */
export type ViabilityInputs={
  averageSaleCents:number;
  commissionBps:number;
  processingCents:number;
  handlingCents:number;
  incidentProvisionCents:number;
  fixedMonthlyCents:number;
  paidSales:number;
};
function nonnegative(name:string,n:number){
 if(!Number.isSafeInteger(n)||n<0)throw Error(name+" must be a non-negative safe integer");
}
function safe(value:bigint,name:string):number{
 if(value>BigInt(Number.MAX_SAFE_INTEGER)||value<BigInt(Number.MIN_SAFE_INTEGER))
  throw Error(name+" overflow");
 return Number(value);
}
export function calculateViability(inputs:ViabilityInputs){
 const {averageSaleCents,commissionBps,processingCents,handlingCents,incidentProvisionCents,fixedMonthlyCents,paidSales}=inputs;
 for(const [name,value] of Object.entries(inputs))nonnegative(name,value);
 if(commissionBps>10000)throw Error("commissionBps must be <= 10000");
 const price=BigInt(averageSaleCents);
 const commission=(price*BigInt(commissionBps)+5000n)/10000n;
 const variable=BigInt(processingCents)+BigInt(handlingCents)+BigInt(incidentProvisionCents);
 const contribution=commission-variable;
 const monthly=contribution*BigInt(paidSales)-BigInt(fixedMonthlyCents);
 const breakEvenOrders=fixedMonthlyCents===0?0:contribution>0n
  ?safe((BigInt(fixedMonthlyCents)+contribution-1n)/contribution,"breakEvenOrders"):null;
 return {
  commissionPerSaleCents:safe(commission,"commission"),
  variableCostPerSaleCents:safe(variable,"variableCost"),
  contributionPerSaleCents:safe(contribution,"contribution"),
  monthlyResultCents:safe(monthly,"monthlyResult"),
  breakEvenOrders
 };
}
