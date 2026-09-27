"use client";

import {useEffect,useState} from "react";
import {RefreshCw,X} from "lucide-react";
import {chains} from "@/lib/chains";
import {displayTokenSymbol} from "@/lib/tokens";
import {shortAddress,useWallet} from "@/components/wallet-provider";
import {shortSolanaAddress,useSolanaWallet} from "@/components/solana-wallet-provider";
import {BrandLogo} from "@/components/brand-logo";
import {TokenIcon} from "@/components/token-icon";
import {WalletMark} from "@/components/wallet-mark";

type Holding={symbol:string;name:string;amount:string;address?:string;logoURI?:string};
type PortfolioResult={holdings:Holding[];partial:boolean;scope:string};
function pretty(amount:string){const [whole,fraction=""]=amount.split(".");const decimals=fraction.slice(0,6).replace(/0+$/,"");return whole.replace(/\B(?=(\d{3})+(?!\d))/g,",")+(decimals?"."+decimals:"")}

export function WalletPortfolio({onClose,initialNetwork}:{onClose:()=>void;initialNetwork?:number|string}){
 const evm=useWallet();const solana=useSolanaWallet();
 const [network,setNetwork]=useState<number|string>(()=>initialNetwork??(evm.connected?(chains.some(c=>c.id===evm.chainId)?evm.chainId!:8453):"solana"));
 const [result,setResult]=useState<PortfolioResult>();const [loading,setLoading]=useState(false);const [error,setError]=useState("");const [refresh,setRefresh]=useState(0);
 const selected=chains.find(c=>c.id===network)??chains[1];
 const address=selected.family==="solana"?solana.address:evm.address;
 useEffect(()=>{if(!address){setResult(undefined);setError("");setLoading(false);return}
  const controller=new AbortController();setLoading(true);setError("");setResult(undefined);
  fetch(`/api/portfolio?chainId=${network}&address=${encodeURIComponent(address)}`,{cache:"no-store",signal:controller.signal})
   .then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||"Balances unavailable");return data as PortfolioResult})
   .then(data=>{if(!controller.signal.aborted)setResult(data)})
   .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Balances unavailable")})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[network,address,refresh]);
 return <div className="walletPickerBackdrop" onMouseDown={onClose}><div className="walletPicker portfolioPanel" role="dialog" aria-modal="true" aria-label="Connected wallet portfolio" onMouseDown={e=>e.stopPropagation()}>
  <div className="walletPickerHead"><span><b>My portfolio</b><small>Balances for connected wallets</small></span><button aria-label="Close portfolio" onClick={onClose}><X size={18}/></button></div>
  <div className="portfolioAccounts">{evm.connected&&<div><WalletMark name={evm.selectedWallet?.name||"EVM wallet"} icon={evm.selectedWallet?.icon}/><span><b>{evm.selectedWallet?.name||"EVM wallet"}</b><small title={evm.address}>{shortAddress(evm.address)} · {chains.find(c=>c.id===evm.chainId)?.name||"Connected"}</small></span><button onClick={evm.disconnect}>Disconnect</button></div>}{solana.connected&&<div><WalletMark name={solana.selectedWallet||"Solana wallet"} icon={solana.wallets.find(w=>w.name===solana.selectedWallet)?.icon}/><span><b>{solana.selectedWallet||"Solana wallet"}</b><small title={solana.address}>{shortSolanaAddress(solana.address)} · Solana</small></span><button onClick={()=>void solana.disconnect()}>Disconnect</button></div>}</div>
  <div className="portfolioNetworkHead"><b>Assets</b><button aria-label="Refresh portfolio balances" onClick={()=>setRefresh(n=>n+1)} disabled={loading||!address}><RefreshCw size={15}/> Refresh</button></div>
  <div className="portfolioNetworks" aria-label="Portfolio network">{chains.filter(c=>c.family==="solana"?solana.connected:evm.connected).map(c=><button key={c.id} className={network===c.id?"active":""} onClick={()=>setNetwork(c.id)}><BrandLogo kind="network" name={c.name} className="portfolioNetworkLogo"/>{c.name}</button>)}</div>
  <div className="portfolioBalances" role="status">{loading?<p>Loading {selected.name} balances…</p>:error?<p>{error}</p>:result?<><small>{result.scope} on {selected.name}{result.partial?" · Some balances could not be checked":""}</small>{result.holdings.filter(h=>h.amount!=="0").length?result.holdings.filter(h=>h.amount!=="0").map(h=><div className="portfolioHolding" key={h.address||h.symbol}><TokenIcon name={h.symbol} address={h.address} logoURI={h.logoURI} className="portfolioTokenLogo"/><span><b>{displayTokenSymbol(h.symbol)}</b><small>{h.name}</small></span><strong>{pretty(h.amount)}</strong></div>):<p>No balance found among these assets.</p>}</>:<p>Select a connected network to view balances.</p>}</div>
  <p className="portfolioScope">Shows on-chain amounts for the native asset and tracked popular tokens. Other tokens, NFTs, and fiat values are not included.</p>
 </div></div>;
}
