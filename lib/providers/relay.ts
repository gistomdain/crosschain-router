import {resolveToken} from "../token-catalog";
import type {NormalizedQuote,QuoteProvider,QuoteRequest,ProviderTransaction} from "./types";
import {fromBaseUnits,toBaseUnits} from "../token-addresses";
import {getSolanaMint,isSolanaAddress} from "../solana";
import {RELAY_SOLANA_CHAIN_ID} from "./relay-solana";
import {normalizeProviderTransaction} from "./normalize";
const API="https://api.relay.link";
export const relayProvider:QuoteProvider={name:"Relay",async quote(input:QuoteRequest,signal?:AbortSignal):Promise<NormalizedQuote|null>{
 const solanaDestination=input.toChain==="solana";const [from,to]=await Promise.all([resolveToken(input.fromChain,input.fromToken),solanaDestination?Promise.resolve(getSolanaMint(input.toToken)):resolveToken(input.toChain,input.toToken)]);
 if(!from||!to||!input.userAddress||typeof input.fromChain!=="number")return null;
 const recipient=solanaDestination?input.destinationAddress:input.userAddress;
 if(solanaDestination?!isSolanaAddress(recipient):!/^0x[a-fA-F0-9]{40}$/.test(recipient??""))return null;
 const headers:Record<string,string>={"content-type":"application/json",accept:"application/json"};if(process.env.RELAY_API_KEY)headers["x-api-key"]=process.env.RELAY_API_KEY;
 const amount=toBaseUnits(input.amount,from.decimals),destinationChainId=solanaDestination?RELAY_SOLANA_CHAIN_ID:input.toChain;
 const body={user:input.userAddress,recipient,originChainId:input.fromChain,destinationChainId,originCurrency:from.address,destinationCurrency:to.address,amount,tradeType:"EXACT_INPUT"};
 const r=await fetch(API+"/quote/v2",{method:"POST",headers,body:JSON.stringify(body),cache:"no-store",signal});if(r.status===429)throw new Error("Relay rate limited");if(r.status>=500)throw new Error("Relay quote unavailable");if(!r.ok)return null;
 const q=await r.json(),details=q.details??{},out=details.currencyOut;
 if(String(details.sender).toLowerCase()!==input.userAddress.toLowerCase()||details.recipient!==recipient||details.currencyIn?.currency?.chainId!==input.fromChain||String(details.currencyIn?.currency?.address).toLowerCase()!==from.address.toLowerCase()||String(details.currencyIn?.amount)!==amount||out?.currency?.chainId!==destinationChainId||String(out?.currency?.address).toLowerCase()!==to.address.toLowerCase())return null;
 if(!/^\d+$/.test(String(out.amount))||BigInt(out.amount)<=0n)return null;
 const txs:ProviderTransaction[]=[];for(const step of q.steps??[])for(const item of step.items??[]){if(step.kind!=="transaction")return null;const d=item.data??item,normalized=normalizeProviderTransaction(d,input.fromChain);if(!normalized)return null;txs.push(normalized)}
 if(txs.length<1||txs.length>3)return null;const tx=txs.at(-1)!;
 const feeUsd=Array.isArray(details.fees)?details.fees.reduce((n:number,x:{amountUsd?:string;amountUSD?:string})=>n+Number(x.amountUsd??x.amountUSD??0),0):Number(details.totalFeeUsd??0);
 return{id:"relay",provider:"Relay",receive:fromBaseUnits(String(out.amount),to.decimals),minReceive:out.minimumAmount?fromBaseUnits(String(out.minimumAmount),to.decimals):undefined,feeUsd:Number.isFinite(feeUsd)&&feeUsd>=0?feeUsd:undefined,etaSeconds:Number(details.timeEstimate??q.timeEstimate??0)||undefined,steps:[String(input.fromChain),"Relay",String(input.toChain)],expiresAt:q.expirationTime?new Date(q.expirationTime).toISOString():new Date(Date.now()+20000).toISOString(),approvalTxs:txs.slice(0,-1),tx,tracking:{requestId:q.requestId},routeMeta:{source:"Relay",execution:"solver",hopCount:1},raw:q};
}};
