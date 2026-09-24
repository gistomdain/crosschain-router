import type {NormalizedQuote,QuoteProvider,QuoteRequest} from "./types";
import {fromBaseUnits,getToken,toBaseUnits} from "../token-addresses";
export const lifiProvider:QuoteProvider={name:"LI.FI",async quote(input:QuoteRequest):Promise<NormalizedQuote|null>{
 const from=getToken(input.fromChain,input.fromToken),to=getToken(input.toChain,input.toToken);if(!from||!to||!input.userAddress)return null;
 const params=new URLSearchParams({fromChain:String(input.fromChain),toChain:String(input.toChain),fromToken:from.address,toToken:to.address,fromAmount:toBaseUnits(input.amount,from.decimals),fromAddress:input.userAddress});
 const headers:Record<string,string>={accept:"application/json"};if(process.env.LIFI_API_KEY)headers["x-lifi-api-key"]=process.env.LIFI_API_KEY;
 const res=await fetch("https://li.quest/v1/quote?"+params,{headers,cache:"no-store"});if(!res.ok)return null;const q=await res.json();
 const out=q?.estimate?.toAmount;if(!out||!q?.transactionRequest)return null;
 const fees=Array.isArray(q.estimate?.feeCosts)?q.estimate.feeCosts.reduce((n:number,x:any)=>n+Number(x.amountUSD||0),0):0;
 const gas=Array.isArray(q.estimate?.gasCosts)?q.estimate.gasCosts.reduce((n:number,x:any)=>n+Number(x.amountUSD||0),0):0;
 return{id:"lifi",provider:"LI.FI",receive:fromBaseUnits(String(out),to.decimals),feeUsd:fees+gas,etaSeconds:Number(q.estimate?.executionDuration||0)||undefined,steps:[String(input.fromChain),"LI.FI",String(input.toChain)],expiresAt:new Date(Date.now()+20000).toISOString(),tx:{to:q.transactionRequest.to,data:q.transactionRequest.data,value:q.transactionRequest.value},raw:q};
}};