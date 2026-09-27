"use client";
import {X,Search} from "lucide-react";
import {useEffect,useMemo,useState} from "react";
import {BrandLogo} from "@/components/brand-logo";
import {chains,type Chain} from "@/lib/chains";
import {tokensFor,type Token} from "@/lib/tokens";

type CatalogResult={total:number;tokens:{chainId:number;address:string;symbol:string;name:string;decimals:number;sources:string[]}[]};
export function AssetSelector({open,onClose,title,chain,onChain,onToken,executionFamily}:{open:boolean;onClose:()=>void;title:string;chain:Chain;onChain:(c:Chain)=>void;onToken:(t:Token)=>void;executionFamily?:"evm"|"solana"}){
 const [q,setQ]=useState("");const [remote,setRemote]=useState<Token[]>([]);const [total,setTotal]=useState(0);const [loading,setLoading]=useState(false);const [error,setError]=useState(false);
 useEffect(()=>{
  if(!open||chain.family!=="evm"){setRemote([]);setTotal(0);setLoading(false);setError(false);return}
  const controller=new AbortController();setTotal(0);setLoading(true);setError(false);
  const timer=setTimeout(async()=>{
   try{const r=await fetch(`/api/tokens?chain=${chain.id}&q=${encodeURIComponent(q.trim())}`,{signal:controller.signal});if(!r.ok)throw new Error("Catalog unavailable");const data:CatalogResult=await r.json();if(!Array.isArray(data.tokens))throw new Error("Invalid catalog");setRemote(data.tokens.map(t=>({...t,chains:[chain.id]})));setTotal(data.total)}
   catch{if(!controller.signal.aborted){setRemote([]);setError(true)}}
   finally{if(!controller.signal.aborted)setLoading(false)}
  },q?250:0);
  return()=>{clearTimeout(timer);controller.abort()};
 },[open,chain.id,chain.family,q]);
 const available=useMemo(()=>{
  const query=q.trim().toLowerCase();const items=chain.family==="evm"?(error||loading?tokensFor(chain.id):remote):tokensFor(chain.id);
  return items.filter(t=>!query||`${t.symbol} ${t.name} ${t.address??""}`.toLowerCase().includes(query));
 },[chain.id,chain.family,remote,error,loading,q]);
 if(!open)return null;
 return <div className="selectorBackdrop" onMouseDown={onClose}><div className="selector" onMouseDown={e=>e.stopPropagation()}><div className="selectorHead"><b>{title}</b><button aria-label="Close token selector" onClick={onClose}><X size={16}/></button></div><small>Network</small><div className="chainGrid">{chains.map(c=><button className={(c.id===chain.id?"active ":"")+(executionFamily&&c.family!==executionFamily?"unsupported":"")} key={String(c.id)} onClick={()=>{onChain(c);setQ("")}}><BrandLogo kind="network" name={c.name} className="selectorLogo"/><span>{c.name}{executionFamily&&c.family!==executionFamily&&<small>View only</small>}</span></button>)}</div><div className="tokenSearch"><Search size={14}/><input placeholder="Search name, symbol, or contract address" value={q} onChange={e=>setQ(e.target.value)}/></div>{chain.family==="evm"&&<p className="tokenCatalogNote">Tokens listed by LI.FI or Relay. A live quote is required before signing.</p>}{loading&&<p className="tokenCatalogNote" role="status">Loading tokens…</p>}{error&&<p className="tokenCatalogNote" role="status">Live token list is unavailable. Showing the default tokens.</p>}<div className="tokenList">{available.slice(0,120).map(t=><button key={t.address??t.symbol} onClick={()=>{onToken(t);onClose()}}><BrandLogo kind="token" name={t.symbol} className="selectorLogo"/><span><b>{t.symbol}</b><small>{t.name}{t.address?` · ${t.address.slice(0,8)}…${t.address.slice(-6)}`:""}</small>{t.sources&&<small>{t.sources.join(" + ")}</small>}</span></button>)}{!loading&&available.length===0&&<p className="tokenCatalogNote">No matching tokens. Try a contract address.</p>}{total>120&&<p className="tokenCatalogNote">Showing 120 of {total}. Search by name or contract address to narrow the list.</p>}</div></div></div>
}
