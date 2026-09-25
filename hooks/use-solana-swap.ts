"use client";
import {useState} from "react";
import {getBase58Decoder,getTransactionDecoder} from "@solana/kit";
import {useSolanaWallet} from "@/components/solana-wallet-provider";

function decodeBase64(value:string){
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(value)||value.length%4!==0)throw new Error("Invalid Solana transaction encoding");
 let raw:string;try{raw=atob(value)}catch{throw new Error("Invalid Solana transaction encoding")}
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
type SendingSigner={signAndSendTransactions:(transactions:readonly unknown[],config?:{abortSignal?:AbortSignal})=>Promise<readonly Uint8Array[]>};

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
   const bytes=decodeBase64(data.swapTransaction);if(bytes.length===0||bytes.length>1232)throw new Error("Invalid Solana transaction payload");
   const transaction=getTransactionDecoder().decode(bytes);
   const signer=wallet.signer as SendingSigner;if(typeof signer.signAndSendTransactions!=="function")throw new Error("Connected Solana wallet cannot submit transactions");
   setStatus("Waiting for wallet approval");const sendController=new AbortController();const sendTimer=setTimeout(()=>sendController.abort(),60000);let signatures:readonly Uint8Array[];
   try{signatures=await signer.signAndSendTransactions([transaction],{abortSignal:sendController.signal})}
   catch(e){if(sendController.signal.aborted)throw new Error("Solana wallet approval timed out. No automatic retry was attempted.");throw e}
   finally{clearTimeout(sendTimer)}
   if(signatures.length!==1||!signatures[0]?.length)throw new Error("Wallet returned no Solana transaction signature");
   const submitted=getBase58Decoder().decode(signatures[0]);setSignature(submitted);setStatus("Submitted to Solana");return submitted;
  }catch(e){const message=e instanceof Error?e.message:"Solana swap failed";setError(message);setStatus(undefined);throw e}
 };
 return{execute,status,error,signature,wallet}
}
