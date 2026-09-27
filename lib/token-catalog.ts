import {getToken,type CanonicalToken} from "./token-addresses";

export type CatalogToken={chainId:number;address:string;symbol:string;name:string;decimals:number;logoURI?:string;sources:("LI.FI"|"Relay")[]};
const ADDRESS=/^0x[a-fA-F0-9]{40}$/;
const supportedChains=new Set([1,8453,42161,10,137,56,43114,59144,4663]);
const headers:Record<string,string>={accept:"application/json"};
if(process.env.LIFI_API_KEY)headers["x-lifi-api-key"]=process.env.LIFI_API_KEY;
const relayHeaders:Record<string,string>={"content-type":"application/json",accept:"application/json"};
if(process.env.RELAY_API_KEY)relayHeaders["x-api-key"]=process.env.RELAY_API_KEY;

function imageUrl(value:unknown):string|undefined{
 if(typeof value!=="string"||value.length>700)return;
 try{const url=new URL(value);if(url.protocol!=="https:"||url.username||url.password||url.port&&url.port!=="443"||!url.hostname.includes(".")||/^(?:localhost|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(url.hostname))return;return url.href}catch{return}
}

function normalize(raw:unknown,chainId:number,source:"LI.FI"|"Relay"):CatalogToken|null{
 if(!raw||typeof raw!=="object")return null;
 const t=raw as Record<string,unknown>;
 if(Number(t.chainId)!==chainId||typeof t.address!=="string"||!ADDRESS.test(t.address)||typeof t.symbol!=="string"||!t.symbol.trim()||t.symbol.length>32||typeof t.name!=="string"||t.name.length>120||!Number.isInteger(t.decimals)||Number(t.decimals)<0||Number(t.decimals)>36)return null;
 const metadata=t.metadata&&typeof t.metadata==="object"?t.metadata as Record<string,unknown>:{};
 return{chainId,address:t.address,symbol:t.symbol,name:t.name,decimals:Number(t.decimals),logoURI:imageUrl(t.logoURI)??imageUrl(metadata.logoURI),sources:[source]};
}
async function lifiTokens(chainId:number):Promise<CatalogToken[]>{
 const response=await fetch(`https://li.quest/v1/tokens?chains=${chainId}&minPriceUSD=0`,{headers,next:{revalidate:300},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error("LI.FI token catalog unavailable");
 const data=await response.json();const list=data?.tokens?.[String(chainId)];
 if(!Array.isArray(list))throw new Error("Invalid LI.FI token catalog");
 return list.map((t:unknown)=>normalize(t,chainId,"LI.FI")).filter((t:CatalogToken|null):t is CatalogToken=>!!t);
}
async function relayTokens(chainId:number,term:string):Promise<CatalogToken[]>{
 const response=await fetch("https://api.relay.link/currencies/v2",{method:"POST",headers:relayHeaders,body:JSON.stringify({chainIds:[chainId],...(term?{term}:{defaultList:true}),limit:100}),next:{revalidate:300},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error("Relay token catalog unavailable");
 const list=await response.json();if(!Array.isArray(list))throw new Error("Invalid Relay token catalog");
 return list.map((t:unknown)=>normalize(t,chainId,"Relay")).filter((t:CatalogToken|null):t is CatalogToken=>!!t);
}
export async function catalogFor(chainId:number,term=""){
 if(!supportedChains.has(chainId))return{tokens:[],available:false};
 const [lifi,relay]=await Promise.allSettled([lifiTokens(chainId),relayTokens(chainId,term)]);
 const byAddress=new Map<string,CatalogToken>();
 for(const token of [...(lifi.status==="fulfilled"?lifi.value:[]),...(relay.status==="fulfilled"?relay.value:[])]){
  const key=token.address.toLowerCase();const existing=byAddress.get(key);
  if(existing){existing.sources=[...new Set([...existing.sources,...token.sources])];existing.logoURI??=token.logoURI}else byAddress.set(key,token);
 }
 const query=term.trim().toLowerCase();const tokens=[...byAddress.values()].filter(t=>!query||`${t.symbol} ${t.name} ${t.address}`.toLowerCase().includes(query));
 const featured=["USDC","ETH","USDT","WBTC","DAI","SOL","BNB","POL","AVAX"];tokens.sort((a,b)=>{const aRank=featured.indexOf(a.symbol),bRank=featured.indexOf(b.symbol);return (aRank<0?99:aRank)-(bRank<0?99:bRank)||a.symbol.localeCompare(b.symbol)||a.address.localeCompare(b.address)});
 return{tokens,available:lifi.status==="fulfilled"||relay.status==="fulfilled"};
}
export async function resolveToken(chainId:number|string,identifier:string):Promise<CanonicalToken|undefined>{
 if(typeof chainId!=="number"||!supportedChains.has(chainId)||typeof identifier!=="string")return;
 if(!ADDRESS.test(identifier))return getToken(chainId,identifier);
 // Resolve metadata against a provider catalog on every server request, never from browser-supplied decimals.
 const li=fetch(`https://li.quest/v1/token?chain=${chainId}&token=${encodeURIComponent(identifier)}`,{headers,next:{revalidate:300},signal:AbortSignal.timeout(15000)}).then(async r=>r.ok?normalize(await r.json(),chainId,"LI.FI"):null);
 const relay=fetch("https://api.relay.link/currencies/v2",{method:"POST",headers:relayHeaders,body:JSON.stringify({chainIds:[chainId],address:identifier,limit:100}),next:{revalidate:300},signal:AbortSignal.timeout(15000)}).then(async r=>r.ok?(await r.json() as unknown[]).map(t=>normalize(t,chainId,"Relay")).find(Boolean):null);
 const token=await new Promise<CatalogToken|null>(resolve=>{let pending=2;for(const candidate of [li,relay])candidate.then(t=>{if(t?.address.toLowerCase()===identifier.toLowerCase())resolve(t);else if(--pending===0)resolve(null)}).catch(()=>{if(--pending===0)resolve(null)})});
 if(!token||token.address.toLowerCase()!==identifier.toLowerCase())return;
 return{chainId,symbol:token.symbol,address:token.address,decimals:token.decimals};
}
