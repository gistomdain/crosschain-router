"use client";
import {useEffect,useState} from "react";
export type TransferStatus={provider:string;status:string;terminal:boolean;sourceConfirmed?:boolean;sourceFailed?:boolean;destinationTxHash?:string|null;refundTxHash?:string|null;note?:string};
export function useTransferStatus(provider?:string,txHash?:string,sourceChainId?:number,tracking?:{orderId?:string;requestId?:string;routeId?:string}){const [startedAt,setStartedAt]=useState(()=>Date.now());const [data,setData]=useState<TransferStatus|null>(null);const [error,setError]=useState<string>();
 useEffect(()=>{setStartedAt(Date.now());setData(null);setError(undefined)},[provider,txHash]);
 useEffect(()=>{if(!provider||!txHash)return;let stopped=false;const check=async()=>{try{const r=await fetch("/api/status?provider="+encodeURIComponent(provider)+"&txHash="+encodeURIComponent(txHash)+(sourceChainId?"&sourceChainId="+sourceChainId:"")+(tracking?.orderId?"&orderId="+encodeURIComponent(tracking.orderId):"")+(tracking?.requestId?"&requestId="+encodeURIComponent(tracking.requestId):""),{cache:"no-store"});if(!r.ok)throw new Error("Status check failed");const next=await r.json();if(!stopped)setData(next)}catch(e){if(!stopped)setError(e instanceof Error?e.message:"Status check failed")}};
 check();const timer=setInterval(()=>{if(!data?.terminal)check()},10000);return()=>{stopped=true;clearInterval(timer)}},[provider,txHash,sourceChainId,tracking?.orderId,tracking?.requestId,data?.terminal]);
 return{data,error,startedAt};
}