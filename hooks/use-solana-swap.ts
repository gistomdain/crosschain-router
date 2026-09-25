"use client";
import {useState} from "react";
import {useSolanaWallet} from "@/components/solana-wallet-provider";

export function useSolanaSwap(){
 const wallet=useSolanaWallet();const [status,setStatus]=useState<string>();const [error,setError]=useState<string>();const [signature,setSignature]=useState<string>();
 const execute=async(input:{amount:string;fromToken:string;toToken:string;reviewedReceive?:string})=>{
  if(!wallet.address)throw new Error("Connect Solana wallet first");
  if(!wallet.signer)throw new Error("Connected Solana wallet does not expose a transaction signer");
  setError(undefined);setStatus("Preparing fresh Jupiter route");
  try{
   const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);let r:Response;
   try{r=await fetch("/api/prepare/solana",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...input,userPublicKey:wallet.address}),signal:controller.signal})}
   catch(e){if(controller.signal.aborted)throw new Error("Solana route preparation timed out. Refresh and try again.");throw e}
   finally{clearTimeout(timer)}
   const data=await r.json();
   if(!r.ok){if(r.status===409&&data.requiresReconfirm)throw new Error(`Route moved ${data.deteriorationBps} bps. Review the refreshed quote before signing.`);throw new Error(data.error||"Could not prepare Solana swap")}
   if(typeof data.swapTransaction!=="string"||data.swapTransaction.length===0||data.swapTransaction.length>4096)throw new Error("Invalid Solana transaction payload");
   // Jupiter currently returns a serialized transaction. Keep this fail-closed until
   // the Kit transaction decoder is wired to the Wallet Standard signer.
   throw new Error("Solana signing migration is in progress. The route was prepared but no transaction was submitted.");
  }catch(e){const message=e instanceof Error?e.message:"Solana swap failed";setError(message);setStatus(undefined);throw e}
 };
 return{execute,status,error,signature,wallet}
}
