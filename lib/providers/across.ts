import type {NormalizedQuote,QuoteProvider,QuoteRequest} from "./types";
import {fromBaseUnits,getToken,toBaseUnits} from "../token-addresses";
import {acrossExpiry,acrossOutputAmount,normalizeProviderTransaction} from "./normalize";

export const acrossProvider:QuoteProvider={name:"Across",async quote(input:QuoteRequest,signal?:AbortSignal):Promise<NormalizedQuote|null>{
 const key=process.env.ACROSS_API_KEY,integratorId=process.env.ACROSS_INTEGRATOR_ID;
 if(!key||!integratorId||!/^0x[a-fA-F0-9]{4}$/.test(integratorId)||!input.userAddress||typeof input.fromChain!=="number"||typeof input.toChain!=="number")return null;
 const from=getToken(input.fromChain,input.fromToken),to=getToken(input.toChain,input.toToken);if(!from||!to)return null;
 const params=new URLSearchParams({tradeType:"exactInput",originChainId:String(input.fromChain),destinationChainId:String(input.toChain),inputToken:from.address,outputToken:to.address,amount:toBaseUnits(input.amount,from.decimals),depositor:input.userAddress,integratorId});
 const res=await fetch("https://app.across.to/api/swap/approval?"+params,{headers:{Authorization:"Bearer "+key,accept:"application/json"},cache:"no-store",signal});if(!res.ok)return null;const q=await res.json();
 const rawOut=acrossOutputAmount(q),expiresAt=acrossExpiry(q),tx=normalizeProviderTransaction(q?.swapTx,input.fromChain);
 if(!rawOut||!expiresAt||!tx||q.swapTx?.simulationSuccess===false)return null;
 if(q.outputToken?.address?.toLowerCase()!==to.address.toLowerCase()||Number(q.outputToken?.chainId)!==input.toChain)return null;
 if(q.inputToken?.address?.toLowerCase()!==from.address.toLowerCase()||Number(q.inputToken?.chainId)!==input.fromChain)return null;
 if(q.approvalTxns!==undefined&&!Array.isArray(q.approvalTxns))return null;
 const sourceChainId=input.fromChain;const approvals=(q.approvalTxns??[]).map((x:unknown)=>normalizeProviderTransaction(x,sourceChainId));if(approvals.length>2||approvals.some((x:unknown)=>!x))return null;
 const feeUsd=Number(q?.fees?.total?.amountUsd);const etaSeconds=Number(q?.expectedFillTime);
 return{id:"across",provider:"Across",receive:fromBaseUnits(rawOut,to.decimals),feeUsd:Number.isFinite(feeUsd)&&feeUsd>=0?feeUsd:undefined,etaSeconds:Number.isFinite(etaSeconds)&&etaSeconds>0?etaSeconds:undefined,steps:[String(input.fromChain),"Across",String(input.toChain)],expiresAt,approvalTxs:approvals,tx,approvalPolicy:q?.checks?.allowance?{token:q.checks.allowance.token,spender:q.checks.allowance.spender,expectedAmount:String(q.checks.allowance.expected??"")}:undefined,capabilities:{destinationActions:true},routeMeta:{source:"Across",execution:"solver",hopCount:1},raw:q};
}};
