"use client";
import {useState} from "react";
import {getBase58Decoder,getTransactionDecoder} from "@solana/kit";
import {Connection,PublicKey,TransactionInstruction,TransactionMessage,VersionedTransaction} from "@solana/web3.js";
import {Buffer} from "buffer";
import {useSolanaWallet} from "@/components/solana-wallet-provider";
import type {RelaySolanaQuote} from "@/lib/providers/relay-solana";

type SendingSigner={signAndSendTransactions:(transactions:readonly unknown[],config?:{abortSignal?:AbortSignal})=>Promise<readonly Uint8Array[]>};
const rpcUrl=process.env.NEXT_PUBLIC_SOLANA_RPC_URL??"https://api.mainnet-beta.solana.com";
export function useSolanaBridge(){const wallet=useSolanaWallet();const [status,setStatus]=useState<string>();const [error,setError]=useState<string>();
 const execute=async(input:{amount:string;fromToken:string;toToken:string;toChain:number;destinationAddress:string;reviewedReceive:string;reviewedMinReceive:string})=>{
  if(!wallet.address||!wallet.signer)throw new Error("Connect a Solana wallet that can submit transactions");
  const sourceAddress=wallet.address;setError(undefined);setStatus("Checking a fresh bridge route");
  try{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);let response:Response;
   try{response=await fetch("/api/prepare/solana-bridge",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...input,userAddress:wallet.address}),signal:controller.signal})}finally{clearTimeout(timer)}
   const prepared=await response.json() as RelaySolanaQuote&{error?:string};if(!response.ok)throw new Error(prepared.error??"Could not prepare bridge route");
   if(Date.parse(prepared.expiresAt)<=Date.now()+3000)throw new Error("Bridge quote expired. Refresh and review again.");
   const connection=new Connection(rpcUrl,"confirmed");const addresses=prepared.lookupTables.map(s=>new PublicKey(s));
   const tables=await Promise.all(addresses.map(async address=>{const result=await connection.getAddressLookupTable(address);if(!result.value)throw new Error("Bridge lookup table is unavailable");return result.value}));
   const instructions=prepared.instructions.map(i=>new TransactionInstruction({programId:new PublicKey(i.programId),keys:i.keys.map(k=>({pubkey:new PublicKey(k.pubkey),isSigner:k.isSigner,isWritable:k.isWritable})),data:Buffer.from(i.data,"hex")}));
   const block=await connection.getLatestBlockhash("confirmed");
   const message=new TransactionMessage({payerKey:new PublicKey(wallet.address),recentBlockhash:block.blockhash,instructions}).compileToV0Message(tables);
   const unsigned=new VersionedTransaction(message);const bytes=new Uint8Array(unsigned.serialize());if(bytes.length>1232)throw new Error("Bridge transaction exceeds Solana size limit");
   setStatus("Simulating Solana transaction");const simulation=await connection.simulateTransaction(unsigned,{sigVerify:false,replaceRecentBlockhash:true});
   if(simulation.value.err)throw new Error("Solana transaction simulation failed. Check your token and SOL balances, then refresh the route.");
   const transaction=getTransactionDecoder().decode(bytes);
   const signer=wallet.signer as SendingSigner;if(typeof signer.signAndSendTransactions!=="function")throw new Error("Solana wallet cannot submit this bridge transaction");
   if(wallet.address!==sourceAddress||Date.parse(prepared.expiresAt)<=Date.now()+3000)throw new Error("Solana wallet or bridge quote changed. Refresh and review the route again.");
   setStatus("Waiting for Solana wallet approval");const sendController=new AbortController(),sendTimer=setTimeout(()=>sendController.abort(),60000);let signatures:readonly Uint8Array[];
   try{signatures=await signer.signAndSendTransactions([transaction],{abortSignal:sendController.signal})}finally{clearTimeout(sendTimer)}
   if(signatures.length!==1||!signatures[0]?.length)throw new Error("Wallet returned no transaction signature. Check wallet activity before retrying.");
   const signature=getBase58Decoder().decode(signatures[0]);setStatus("Bridge submitted");return{signature,requestId:prepared.requestId,receive:prepared.receive,minReceive:prepared.minReceive};
  }catch(e){const message=e instanceof Error?e.message:"Solana bridge failed";setError(message);setStatus(undefined);throw e}
 };
 return{execute,status,error,wallet};
}
