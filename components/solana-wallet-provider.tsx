"use client";
import {createContext,useContext,useEffect,useState} from "react";

export type SolanaProvider={
 isPhantom?:boolean;
 publicKey?:{toString:()=>string};
 isConnected?:boolean;
 connect:(options?:{onlyIfTrusted?:boolean})=>Promise<{publicKey:{toString:()=>string}}>;
 disconnect?:()=>Promise<void>;
 signAndSendTransaction:(transaction:Uint8Array,options?:{skipPreflight?:boolean;maxRetries?:number})=>Promise<{signature:string}>;
 on?:(event:"connect"|"disconnect"|"accountChanged",handler:(key?:{toString:()=>string}|null)=>void)=>void;
 off?:(event:"connect"|"disconnect"|"accountChanged",handler:(key?:{toString:()=>string}|null)=>void)=>void
};
type State={address?:string;connected:boolean;connecting:boolean;error?:string;connect:()=>Promise<void>;disconnect:()=>Promise<void>;provider?:SolanaProvider};
const Context=createContext<State|null>(null);
declare global{interface Window{phantom?:{solana?:SolanaProvider};solana?:SolanaProvider}}

export function SolanaWalletProvider({children}:{children:React.ReactNode}){
 const [address,setAddress]=useState<string>();const [connecting,setConnecting]=useState(false);const [error,setError]=useState<string>();
 const [provider,setProvider]=useState<SolanaProvider>();
 useEffect(()=>{if(typeof window==="undefined")return;const detected=window.phantom?.solana??window.solana;if(detected)setProvider(detected)},[]);
 useEffect(()=>{
  if(!provider)return;
  const sync=(key?:{toString:()=>string}|null)=>setAddress(key?.toString()??provider.publicKey?.toString());
  const clear=()=>setAddress(undefined);
  const account=(key?:{toString:()=>string}|null)=>key?setAddress(key.toString()):setAddress(undefined);
  if(provider.publicKey)sync(provider.publicKey);
  else provider.connect({onlyIfTrusted:true}).then(r=>sync(r.publicKey)).catch(()=>{});
  provider.on?.("connect",sync);provider.on?.("disconnect",clear);provider.on?.("accountChanged",account);
  return()=>{provider.off?.("connect",sync);provider.off?.("disconnect",clear);provider.off?.("accountChanged",account)}
 },[provider]);
 const connect=async()=>{setError(undefined);if(!provider){setError("No compatible Solana browser wallet detected");return}setConnecting(true);try{const r=await provider.connect();setAddress(r.publicKey.toString())}catch(e){setError(e instanceof Error?e.message:"Solana wallet connection failed")}finally{setConnecting(false)}};
 const disconnect=async()=>{await provider?.disconnect?.();setAddress(undefined)};
 return <Context.Provider value={{address,connected:!!address,connecting,error,connect,disconnect,provider}}>{children}</Context.Provider>
}
export function useSolanaWallet(){const v=useContext(Context);if(!v)throw new Error("useSolanaWallet must be used inside SolanaWalletProvider");return v}
export function shortSolanaAddress(a?:string){return a?a.slice(0,4)+"…"+a.slice(-4):""}
