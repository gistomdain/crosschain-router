import type {ProviderTransaction} from "./types";
const ADDRESS=/^0x[a-fA-F0-9]{40}$/;
const DATA=/^0x(?:[a-fA-F0-9]{2})*$/;
export function normalizeProviderTransaction(raw:unknown,expectedChainId:number):ProviderTransaction|null{
 if(!raw||typeof raw!=="object")return null;
 const tx=raw as Record<string,unknown>;
 if(typeof tx.to!=="string"||!ADDRESS.test(tx.to)||typeof tx.data!=="string"||!DATA.test(tx.data)||tx.data.length>100_000)return null;
 const chainId=tx.chainId===undefined?expectedChainId:Number(tx.chainId);
 if(!Number.isSafeInteger(chainId)||chainId!==expectedChainId)return null;
 let value="0x0";
 if(tx.value!==undefined&&tx.value!==null){
  if(typeof tx.value!=="string"&&typeof tx.value!=="number")return null;
  const rawValue=String(tx.value);
  if(!/^(?:\d+|0x[a-fA-F0-9]+)$/.test(rawValue)||rawValue.length>100)return null;
  try{value="0x"+BigInt(rawValue).toString(16)}catch{return null}
 }
 return{to:tx.to,data:tx.data,value,chainId};
}
export function exactTokenApproval(token:string,spender:unknown,amount:string,chainId:number):ProviderTransaction|null{
 if(!ADDRESS.test(token)||typeof spender!=="string"||!ADDRESS.test(spender)||/^0x0{40}$/i.test(spender)||!/^\d+$/.test(amount)||BigInt(amount)<=0n)return null;
 const data="0x095ea7b3"+spender.slice(2).toLowerCase().padStart(64,"0")+BigInt(amount).toString(16).padStart(64,"0");
 return{to:token,data,value:"0x0",chainId};
}
export function acrossOutputAmount(response:unknown):string|null{
 if(!response||typeof response!=="object")return null;
 const q=response as Record<string,any>;
 const amount=q.steps?.destinationSwap?.outputAmount??q.steps?.bridge?.outputAmount;
 return typeof amount==="string"&&/^\d+$/.test(amount)&&BigInt(amount)>0n?amount:null;
}
export function acrossExpiry(response:unknown):string|null{
 if(!response||typeof response!=="object")return null;
 const seconds=(response as Record<string,unknown>).quoteExpiryTimestamp;
 if(typeof seconds!=="number"||!Number.isSafeInteger(seconds)||seconds<=0)return null;
 const ms=seconds*1000;
 return Number.isFinite(ms)&&ms>Date.now()+3000?new Date(ms).toISOString():null;
}
