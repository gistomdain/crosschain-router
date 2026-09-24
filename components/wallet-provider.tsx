"use client";
import {createContext,useCallback,useContext,useEffect,useState} from "react";
type WalletState={address?:`0x${string}`;chainId?:number;connected:boolean;connecting:boolean;error?:string;connect:()=>Promise<void>;disconnect:()=>void;switchChain:(chainId:number)=>Promise<void>};
const Context=createContext<WalletState|null>(null);
declare global{interface Window{ethereum?:{request:(args:{method:string;params?:unknown[]})=>Promise<any>;on?:(event:string,cb:(...args:any[])=>void)=>void;removeListener?:(event:string,cb:(...args:any[])=>void)=>void}}}
export function WalletProvider({children}:{children:React.ReactNode}){const [address,setAddress]=useState<`0x${string}`>();const [chainId,setChainId]=useState<number>();const [connecting,setConnecting]=useState(false);const [error,setError]=useState<string>();
 const sync=useCallback(async()=>{if(!window.ethereum)return;const accounts=await window.ethereum.request({method:"eth_accounts"});const chain=await window.ethereum.request({method:"eth_chainId"});setAddress(accounts?.[0]);setChainId(Number(chain))},[]);
 useEffect(()=>{sync();const accounts=(a:string[])=>setAddress(a?.[0] as `0x${string}`|undefined);const chain=(id:string)=>setChainId(Number(id));window.ethereum?.on?.("accountsChanged",accounts);window.ethereum?.on?.("chainChanged",chain);return()=>{window.ethereum?.removeListener?.("accountsChanged",accounts);window.ethereum?.removeListener?.("chainChanged",chain)}},[sync]);
 const connect=async()=>{setError(undefined);if(!window.ethereum){setError("No EVM wallet detected");return}setConnecting(true);try{const accounts=await window.ethereum.request({method:"eth_requestAccounts"});const chain=await window.ethereum.request({method:"eth_chainId"});setAddress(accounts?.[0]);setChainId(Number(chain))}catch(e){setError(e instanceof Error?e.message:"Wallet connection failed")}finally{setConnecting(false)}};
 const disconnect=()=>setAddress(undefined);
 const switchChain=async(id:number)=>{if(!window.ethereum)throw new Error("No EVM wallet detected");await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x"+id.toString(16)}]});setChainId(id)};
 return <Context.Provider value={{address,chainId,connected:!!address,connecting,error,connect,disconnect,switchChain}}>{children}</Context.Provider>}
export function useWallet(){const v=useContext(Context);if(!v)throw new Error("useWallet must be used inside WalletProvider");return v}
export function shortAddress(address?:string){return address?address.slice(0,6)+"…"+address.slice(-4):""}