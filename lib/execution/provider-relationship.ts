import type {NormalizedQuote} from "@/lib/providers/types";
const address=(v?:string)=>!!v&&/^0x[a-fA-F0-9]{40}$/.test(v);
export function validateProviderRelationship(quote:NormalizedQuote){
 const errors:string[]=[];if(!quote.tx||!address(quote.tx.to))return{ok:false,errors:["Provider execution target is invalid."]};
 const approvals=quote.approvalTxs??[];for(const approval of approvals){if(!address(approval.to))errors.push("Approval token target is invalid.");}
 if(quote.provider.toLowerCase()==="relay"&&approvals.some(a=>a.to.toLowerCase()===quote.tx!.to.toLowerCase()))errors.push("Relay approval target unexpectedly matches the execution contract.");
 return{ok:errors.length===0,errors};
}
