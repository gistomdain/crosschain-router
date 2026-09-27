import {resolveToken} from "../token-catalog";
import {getSolanaMint,isSolanaAddress,parseSolanaAmount} from "@/lib/solana";
import {fromBaseUnits} from "@/lib/token-addresses";

export const RELAY_SOLANA_CHAIN_ID=792703809;
const EVM_ADDRESS=/^0x[a-fA-F0-9]{40}$/;
export type SolanaBridgeInput={fromToken:string;toToken:string;toChain:number;amount:string;sourceAddress:string;destinationAddress:string};
export type RelaySolanaInstruction={programId:string;keys:{pubkey:string;isSigner:boolean;isWritable:boolean}[];data:string};
export type RelaySolanaQuote={receive:string;minReceive:string;fee?:number;eta:string;requestId:string;expiresAt:string;instructions:RelaySolanaInstruction[];lookupTables:string[]};

export async function getRelaySolanaQuote(input:SolanaBridgeInput,signal?:AbortSignal):Promise<RelaySolanaQuote|null>{
 const source=getSolanaMint(input.fromToken),target=await resolveToken(input.toChain,input.toToken);
 if(!source||!target||!isSolanaAddress(input.sourceAddress)||!EVM_ADDRESS.test(input.destinationAddress))return null;
 const amount=parseSolanaAmount(input.amount,source.decimals);if(!amount)return null;
 const headers:Record<string,string>={"content-type":"application/json",accept:"application/json"};
 if(process.env.RELAY_API_KEY)headers.Authorization="Bearer "+process.env.RELAY_API_KEY;
 const response=await fetch("https://api.relay.link/quote/v2",{method:"POST",headers,body:JSON.stringify({user:input.sourceAddress,recipient:input.destinationAddress,originChainId:RELAY_SOLANA_CHAIN_ID,destinationChainId:input.toChain,originCurrency:source.address,destinationCurrency:target.address,amount,tradeType:"EXACT_INPUT"}),cache:"no-store",signal});
 if(!response.ok)return null;
 const quote=await response.json();const out=quote.details?.currencyOut;
 if(quote.details?.sender!==input.sourceAddress||String(quote.details?.recipient).toLowerCase()!==input.destinationAddress.toLowerCase())return null;
 if(out?.currency?.chainId!==input.toChain||String(out?.currency?.address).toLowerCase()!==target.address.toLowerCase())return null;
 if(quote.details?.currencyIn?.currency?.chainId!==RELAY_SOLANA_CHAIN_ID||quote.details?.currencyIn?.currency?.address!==source.address||String(quote.details?.currencyIn?.amount)!==amount)return null;
 if(typeof out.amount!=="string"||!/^[1-9]\d*$/.test(out.amount)||typeof out.minimumAmount!=="string"||!/^[1-9]\d*$/.test(out.minimumAmount)||BigInt(out.minimumAmount)>BigInt(out.amount))return null;
 const items=quote.steps?.flatMap((step:{kind?:string;items?:unknown[]})=>step.kind==="transaction"?step.items??[]:[]);
 if(!Array.isArray(quote.steps)||quote.steps.length!==1||quote.steps[0].kind!=="transaction"||items?.length!==1)return null;
 const data=items[0]?.data,rawInstructions=data?.instructions,lookupTables=data?.addressLookupTableAddresses??[];
 if(!Array.isArray(rawInstructions)||rawInstructions.length<1||rawInstructions.length>12||!Array.isArray(lookupTables)||lookupTables.length>8)return null;
 if(!lookupTables.every(isSolanaAddress))return null;
 const instructions:RelaySolanaInstruction[]=[];
 for(const instruction of rawInstructions){if(!isSolanaAddress(instruction?.programId)||!Array.isArray(instruction?.keys)||instruction.keys.length>40||typeof instruction.data!=="string"||instruction.data.length>3000||!/^(?:[0-9a-f]{2})*$/i.test(instruction.data))return null;
  const keys=[];for(const key of instruction.keys){if(!isSolanaAddress(key?.pubkey)||typeof key.isSigner!=="boolean"||typeof key.isWritable!=="boolean"||key.isSigner&&key.pubkey!==input.sourceAddress)return null;keys.push({pubkey:key.pubkey,isSigner:key.isSigner,isWritable:key.isWritable})}
  instructions.push({programId:instruction.programId,keys,data:instruction.data})}
 const requestId=quote.requestId;if(typeof requestId!=="string"||!/^0x[a-fA-F0-9]{64}$/.test(requestId))return null;
 const fee=Number(quote.fees?.relayer?.amountUsd??quote.details?.totalFeeUsd);
 return{receive:fromBaseUnits(out.amount,target.decimals),minReceive:fromBaseUnits(out.minimumAmount,target.decimals),fee:Number.isFinite(fee)&&fee>=0?fee:undefined,eta:quote.details?.timeEstimate?`~${quote.details.timeEstimate} sec`:"—",requestId,expiresAt:new Date(Date.now()+15000).toISOString(),instructions,lookupTables};
}
