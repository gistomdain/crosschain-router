"use client";
import {useState} from "react";
import {RefreshCw} from "lucide-react";
import {amountForFiftyUSD,amountForPercent,reservedGas,spendableRaw} from "@/lib/balance-amount";
import {displayTokenSymbol} from "@/lib/tokens";
import {useTokenBalance} from "@/hooks/use-token-balance";

function readable(value:string){const [whole,fraction=""]=value.split(".");const shown=fraction.slice(0,8).replace(/0+$/,"");return whole.replace(/\B(?=(\d{3})+(?!\d))/g,",")+(shown?"."+shown:"")}
export function SourceBalance({address,chainId,token,symbol,onAmount,refreshKey}:{address?:string;chainId:number|string;token:string;symbol:string;onAmount:(amount:string)=>void;refreshKey?:string}){
 const [refresh,setRefresh]=useState(0);
 const {balance,loading,error}=useTokenBalance(address,chainId,token,`${refreshKey??""}:${refresh}`);
 const available=balance?spendableRaw(balance,chainId):0n;
 return <div className="sourceBalance"><div className="sourceBalanceLine"><span>{!address?"Connect wallet to see your balance":loading?"Loading balance…":error?"Balance unavailable":balance?`Balance: ${readable(balance.balance)} ${displayTokenSymbol(symbol)}`:"Balance unavailable"}{address&&<button className="balanceRefresh" type="button" disabled={loading} aria-label="Refresh token balance" onClick={()=>setRefresh(n=>n+1)}><RefreshCw size={12}/></button>}</span>{balance?.isNative&&<small title="Reserved so the wallet can pay network fees">Max keeps {reservedGas(chainId)} {displayTokenSymbol(symbol)} for gas</small>}</div>{address&&<div className="amountShortcuts" aria-label="Use wallet balance"><button type="button" disabled={!balance||available===0n||amountForPercent(balance,chainId,25)==="0"} onClick={()=>balance&&onAmount(amountForPercent(balance,chainId,25))}>25%</button><button type="button" title="Approximate $50 at the latest available token price" disabled={!balance||!amountForFiftyUSD(balance,chainId)} onClick={()=>{const value=balance&&amountForFiftyUSD(balance,chainId);if(value)onAmount(value)}}>$50</button><button type="button" disabled={!balance||available===0n} onClick={()=>balance&&onAmount(amountForPercent(balance,chainId,100))}>Max</button></div>}</div>;
}
