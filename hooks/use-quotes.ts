"use client";
import {useCallback,useEffect,useState} from "react";
export type UiQuote={id:string;provider:string;receive:number;fee:number;eta:string;label?:string;steps:string[];expiresAt?:string;approvalTxs?:{to:string;data:string;value?:string;chainId?:number}[];tx?:{to:string;data:string;value?:string;chainId?:number}};
type QuoteResponse={mode:"live"|"demo";requestedAt:string;routes:UiQuote[]};
export function useQuotes(amount:string,userAddress?:string){
 const [data,setData]=useState<QuoteResponse|null>(null);const [loading,setLoading]=useState(false);const [error,setError]=useState<string|null>(null);
 const refresh=useCallback(async()=>{if(!Number(amount))return;setLoading(true);setError(null);try{const res=await fetch("/api/quote",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({amount,fromChain:1,toChain:"solana",fromToken:"USDC",toToken:"USDC",userAddress})});if(!res.ok)throw new Error("Quote request failed");setData(await res.json())}catch(e){setError(e instanceof Error?e.message:"Quote request failed")}finally{setLoading(false)}},[amount,userAddress]);
 useEffect(()=>{const t=setTimeout(refresh,350);return()=>clearTimeout(t)},[refresh]);
 useEffect(()=>{const t=setInterval(refresh,15000);return()=>clearInterval(t)},[refresh]);
 return{data,loading,error,refresh};
}