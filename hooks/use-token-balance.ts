"use client";
import {useEffect,useState} from "react";
import type {TokenBalance} from "@/lib/balance-amount";

export function useTokenBalance(address:string|undefined,chainId:number|string,token:string,refreshKey?:string){
 const [balance,setBalance]=useState<TokenBalance>();const [loading,setLoading]=useState(false);const [error,setError]=useState(false);
 useEffect(()=>{
  if(!address||!token){setBalance(undefined);setLoading(false);setError(false);return}
  const controller=new AbortController();setBalance(undefined);setLoading(true);setError(false);
  fetch(`/api/balance/token?chainId=${chainId}&address=${encodeURIComponent(address)}&token=${encodeURIComponent(token)}`,{cache:"no-store",signal:controller.signal})
   .then(async response=>{if(!response.ok)throw new Error("Balance unavailable");return response.json()})
   .then((data:TokenBalance)=>{if(!controller.signal.aborted&&typeof data.raw==="string"&&/^\d+$/.test(data.raw)&&Number.isInteger(data.decimals)&&typeof data.isNative==="boolean")setBalance(data);else if(!controller.signal.aborted)setError(true)})
   .catch(()=>{if(!controller.signal.aborted)setError(true)})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[address,chainId,token,refreshKey]);
 return {balance,loading,error};
}
