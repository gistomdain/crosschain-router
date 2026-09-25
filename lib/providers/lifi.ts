import type {NormalizedQuote,QuoteProvider,QuoteRequest} from "./types";
import {fromBaseUnits,getToken,toBaseUnits} from "../token-addresses";import {exactTokenApproval,normalizeProviderTransaction} from "./normalize";
export const lifiProvider:QuoteProvider={name:"LI.FI",async quote(input:QuoteRequest,signal?:AbortSignal):Promise<NormalizedQuote|null>{
 const from=getToken(input.fromChain,input.fromToken),to=getToken(input.toChain,input.toToken);if(!from||!to||!input.userAddress)return null;
 const params=new URLSearchParams({fromChain:String(input.fromChain),toChain:String(input.toChain),fromToken:from.address,toToken:to.address,fromAmount:toBaseUnits(input.amount,from.decimals),fromAddress:input.userAddress});
 const headers:Record<string,string>={accept:"application/json"};if(process.env.LIFI_API_KEY)headers["x-lifi-api-key"]=process.env.LIFI_API_KEY;
 const res=await fetch("https://li.quest/v1/quote?"+params,{headers,cache:"no-store",signal});if(!res.ok)return null;const q=await res.json();
 const out=q?.estimate?.toAmount;if(typeof input.fromChain!=="number")return null;const tx=normalizeProviderTransaction(q?.transactionRequest,input.fromChain);const approval=exactTokenApproval(from.address,q?.estimate?.approvalAddress,toBaseUnits(input.amount,from.decimals),input.fromChain);if(!out||!tx||!approval)return null;
 const fees=Array.isArray(q.estimate?.feeCosts)?q.estimate.feeCosts.reduce((n:number,x:any)=>n+Number(x.amountUSD||0),0):0;
 const gas=Array.isArray(q.estimate?.gasCosts)?q.estimate.gasCosts.reduce((n:number,x:any)=>n+Number(x.amountUSD||0),0):0;
 return{id:"lifi",provider:"LI.FI",receive:fromBaseUnits(String(out),to.decimals),feeUsd:fees+gas,etaSeconds:Number(q.estimate?.executionDuration||0)||undefined,steps:[String(input.fromChain),"LI.FI",String(input.toChain)],expiresAt:new Date(Date.now()+20000).toISOString(),approvalTxs:[approval],approvalPolicy:{token:from.address,spender:String(q.estimate.approvalAddress),expectedAmount:toBaseUnits(input.amount,from.decimals)},tx,routeMeta:{source:"LI.FI",execution:String(input.fromChain)===String(input.toChain)?"swap":"swap-bridge"},raw:q};
}};