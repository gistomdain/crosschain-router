"use client";
import {useMemo,useState} from "react";
import {ArrowDown,ChevronDown,Clock3,Route,ShieldCheck,Sparkles,Wallet} from "lucide-react";
import {demoRoutes} from "@/lib/routes";
import {useRouteChangeAlert} from "@/hooks/use-route-change-alert";
import {useQuotes} from "@/hooks/use-quotes";
import {useQuoteCountdown} from "@/hooks/use-quote-countdown";
import {shortAddress,useWallet} from "@/components/wallet-provider";
export default function Home(){
 const [amount,setAmount]=useState("1000");const [selected,setSelected]=useState("relay");
 const wallet=useWallet();
 const scale=Number(amount||0)/1000;const fallback=useMemo(()=>demoRoutes.map(r=>({...r,receive:r.receive*scale,fee:r.fee*scale})),[scale]);
 const {data,loading,error,refresh}=useQuotes(amount,wallet.address);const routes=data?.routes?.length?data.routes:fallback;const current=routes.find(r=>r.id===selected)||routes[0];
 const {seconds,expired}=useQuoteCountdown(current?.expiresAt);
 const snapshots=useMemo(()=>routes.map(r=>({id:r.id,provider:r.provider,receive:r.receive,fee:r.fee,capturedAt:Date.now()})),[routes]);
 const {change,accept,dismiss}=useRouteChangeAlert(snapshots,selected,15000);
 const acceptBetterRoute=()=>{const id=accept();if(id)setSelected(id)};
 return <main><nav><div className="brand"><i>↗</i>Crosschain <b>Router</b></div><div className="navlinks"><a href="#swap">Swap</a><a href="#routes">Routes</a></div><button className="wallet" onClick={wallet.connected?wallet.disconnect:wallet.connect}><Wallet size={16}/> {wallet.connecting?"Connecting…":wallet.connected?shortAddress(wallet.address):"Connect wallet"}</button></nav>
 <header><span className="pill"><Sparkles size={13}/> Cross-chain execution, intelligently routed</span><h1>Move anything.<br/><em>Anywhere.</em></h1><p>Compare bridges and liquidity sources. Get the best route before you sign.</p></header>
 <section className="grid" id="swap"><div className="card"><div className="title"><span><b>Swap & bridge</b><small>{loading?"Refreshing routes…":data?.mode==="live"?"Live provider quotes":"Demo routing · live adapters pending"}</small></span><em>{loading?"↻ UPDATING":"● ROUTING ACTIVE"}</em></div>
 <Asset label="YOU PAY" value={amount} onChange={setAmount} chain="Ethereum" symbol="Ξ" input/><div className="down"><ArrowDown size={17}/></div><Asset label="YOU RECEIVE" value={current.receive.toLocaleString(undefined,{maximumFractionDigits:4})} chain="Solana" symbol="S"/>
 <div className="smart"><div><span><Route size={14}/> SMART ROUTE</span><b>{current.provider}</b></div><div className="path"><i>Ξ</i><hr/><strong>{current.provider[0]}</strong><hr/><i>S</i></div><section><span>Provider<b>{current.provider}</b></span><span>Total cost<b>{"$"}{current.fee.toFixed(2)}</b></span><span>Est. time<b>{current.eta}</b></span></section><div className={"quoteFreshness "+(expired?"expired":"")}><span>{expired?"Quote expired":"Quote protected"}</span><b>{expired?"Refresh required":seconds+"s"}</b><button onClick={refresh}>Refresh</button></div></div>
 {error&&<div className="quoteError">Could not refresh quotes. Showing the last available route.</div>}
 {change&&<div className={"routeAlert "+change.kind}><div><Sparkles size={16}/><span><b>{change.kind==="better-route"?"Better route found":change.kind==="selected-worsened"?"Route changed":"Route improved"}</b><small>{change.kind==="better-route"?change.next.provider+" now gives "+change.delta.toFixed(2)+" USDC more.":Math.abs(change.delta).toFixed(2)+" USDC change detected before signing."}</small></span></div><section>{change.kind==="better-route"&&<button onClick={acceptBetterRoute}>Switch route</button>}<button className="dismiss" onClick={dismiss}>Dismiss</button></section></div>}
 {wallet.error&&<div className="quoteError">{wallet.error}</div>}
 <button className="primary" disabled={expired||wallet.connecting} onClick={!wallet.connected?wallet.connect:undefined}>{expired?"Refresh quote to continue":wallet.connected?"Review route":<><Wallet size={17}/> Connect wallet to continue</>}</button><p className="safe"><ShieldCheck size={13}/> Non-custodial · You approve every transaction</p></div>
 <aside className="card" id="routes"><div className="title"><span><b>Route Intelligence</b><small>{routes.length} routes compared</small></span><em>● UPDATED NOW</em></div><div className="tabs"><button>Best return</button><button>Fastest</button><button>Lowest gas</button></div>
 <div className="routes">{routes.map(r=><button key={r.id} className={selected===r.id?"route selected":"route"} onClick={()=>setSelected(r.id)}><div className="provider"><i>{r.provider[0]}</i><span><b>{r.provider}</b><small>{r.steps.join(" → ")}</small></span>{r.label&&<em>{r.label}</em>}</div><div className="quote"><span>YOU RECEIVE<b>{r.receive.toLocaleString(undefined,{maximumFractionDigits:2})} USDC</b></span><span>COST<b>{"$"}{r.fee.toFixed(2)}</b></span><span><Clock3 size={10}/> ETA<b>{r.eta}</b></span></div></button>)}</div>
 <div className="insight"><Sparkles size={16}/><p><b>Route insight</b><br/>{current.provider} is the selected demo route. Live quotes are the next integration milestone.</p></div></aside></section>
 <footer>Crosschain Router · Demo quotes are illustrative until live provider adapters are enabled.</footer></main>
}
function Asset({label,value,onChange,chain,symbol,input=false}:{label:string;value:string;onChange?:(v:string)=>void;chain:string;symbol:string;input?:boolean}){return <div className="asset"><div className="meta"><span>{label}</span><span>{input?"Balance —":"Estimated"}</span></div><div className="assetrow">{input?<input value={value} onChange={e=>onChange?.(e.target.value.replace(/[^0-9.]/g,""))}/>:<div className="amount">{value}</div>}<button className="token"><i>$</i><b>USDC</b><ChevronDown size={14}/></button></div><button className="chain"><i>{symbol}</i>{chain}<ChevronDown size={12}/></button></div>}