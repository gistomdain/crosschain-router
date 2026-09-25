"use client";
import {useCallback,useEffect,useRef,useState} from "react";
export type UiQuote={id:string;provider:string;receive:number;fee:number;eta:string;label?:string;steps:string[];expiresAt?:string;approvalTxs?:{to:string;data:string;value?:string;chainId?:number}[];tx?:{to:string;data:string;value?:string;chainId?:number};tracking?:{orderId?:string;requestId?:string;routeId?:string}};
export type ProviderHealth={provider:string;status:"healthy"|"slow"|"unavailable";latencyMs:number;quoted:boolean};
type QuoteResponse={providerHealth?:ProviderHealth[];mode:"live"|"unavailable";routeType?:"swap"|"cross-chain";requestedAt:string;routes:UiQuote[];error?:string};
export type QuoteSelection={fromChain:number|string;toChain:number|string;fromToken:string;toToken:string};
export function useQuotes(amount:string,selection:QuoteSelection,userAddress?:string){
 const [data,setData]=useState<QuoteResponse|null>(null);const [loading,setLoading]=useState(false);const [error,setError]=useState<string|null>(null);const requestRef=useRef(0);const controllerRef=useRef<AbortController>();
 const refresh=useCallback(async()=>{const requestId=++requestRef.current;controllerRef.current?.abort();if(!Number(amount)){setData(null);setError(null);setLoading(false);return}const controller=new AbortController();controllerRef.current=controller;setData(null);setLoading(true);setError(null);try{const solanaSwap=selection.fromChain==="solana"&&selection.toChain==="solana";const res=await fetch(solanaSwap?"/api/quote/solana":"/api/quote",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({amount,...selection,userAddress}),signal:controller.signal});if(!res.ok)throw new Error("Quote request failed");const next=await res.json();if(requestId===requestRef.current)setData(next)}catch(e){if(controller.signal.aborted)return;if(requestId===requestRef.current){setData(null);setError(e instanceof Error?e.message:"Quote request failed")}}finally{if(requestId===requestRef.current)setLoading(false)}},[amount,userAddress,selection.fromChain,selection.toChain,selection.fromToken,selection.toToken]);
 useEffect(()=>{const t=setTimeout(refresh,350);return()=>{clearTimeout(t);controllerRef.current?.abort()}},[refresh]);
 useEffect(()=>{const t=setInterval(refresh,15000);return()=>clearInterval(t)},[refresh]);
 return{data,loading,error,refresh};
}
