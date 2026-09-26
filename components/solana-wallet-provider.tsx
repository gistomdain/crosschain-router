"use client";
import dynamic from "next/dynamic";
import {createContext,useContext,useEffect,useState} from "react";
export type SolanaWalletState={address?:string;connected:boolean;connecting:boolean;error?:string;wallets:{name:string;icon?:string}[];selectedWallet?:string;connect:(walletName?:string)=>Promise<void>;disconnect:()=>Promise<void>;signer?:unknown};
export const SolanaWalletContext=createContext<SolanaWalletState|null>(null);
const Runtime=dynamic(()=>import("./solana-wallet-runtime").then(m=>m.SolanaWalletRuntime),{ssr:false});
export function SolanaWalletProvider({children}:{children:React.ReactNode}){
 const [secure,setSecure]=useState(false);
 const [error,setError]=useState<string>();
 useEffect(()=>setSecure(window.isSecureContext===true),[]);
 if(secure)return <Runtime>{children}</Runtime>;
 const fallback:SolanaWalletState={connected:false,connecting:false,error,wallets:[],connect:async()=>setError("Solana wallets require an HTTPS preview or localhost on this device."),disconnect:async()=>setError(undefined)};
 return <SolanaWalletContext.Provider value={fallback}>{children}</SolanaWalletContext.Provider>;
}
export function useSolanaWallet(){const value=useContext(SolanaWalletContext);if(!value)throw new Error("useSolanaWallet must be used inside SolanaWalletProvider");return value}
export function shortSolanaAddress(address?:string){return address?address.slice(0,4)+"…"+address.slice(-4):""}
