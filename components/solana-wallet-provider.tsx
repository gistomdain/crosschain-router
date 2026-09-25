"use client";
import {createContext,useContext,useEffect,useState} from "react";
type SolanaProvider={isPhantom?:boolean;publicKey?:{toString:()=>string};connect:()=>Promise<{publicKey:{toString:()=>string}}>;disconnect?:()=>Promise<void>;signAndSendTransaction:(transaction:unknown)=>Promise<{signature:string}>};
type State={address?:string;connected:boolean;connecting:boolean;error?:string;connect:()=>Promise<void>;disconnect:()=>Promise<void>;provider?:SolanaProvider};
const Context=createContext<State|null>(null);
declare global{interface Window{phantom?:{solana?:SolanaProvider};solana?:SolanaProvider}}
export function SolanaWalletProvider({children}:{children:React.ReactNode}){const [address,setAddress]=useState<string>();const [connecting,setConnecting]=useState(false);const [error,setError]=useState<string>();const provider=typeof window!=="undefined"?(window.phantom?.solana??window.solana):undefined;
 useEffect(()=>{if(provider?.publicKey)setAddress(provider.publicKey.toString())},[provider]);
 const connect=async()=>{setError(undefined);if(!provider){setError("No compatible Solana browser wallet detected");return}setConnecting(true);try{const r=await provider.connect();setAddress(r.publicKey.toString())}catch(e){setError(e instanceof Error?e.message:"Solana wallet connection failed")}finally{setConnecting(false)}};
 const disconnect=async()=>{await provider?.disconnect?.();setAddress(undefined)};
 return <Context.Provider value={{address,connected:!!address,connecting,error,connect,disconnect,provider}}>{children}</Context.Provider>}
export function useSolanaWallet(){const v=useContext(Context);if(!v)throw new Error("useSolanaWallet must be used inside SolanaWalletProvider");return v}
export function shortSolanaAddress(a?:string){return a?a.slice(0,4)+"…"+a.slice(-4):""}