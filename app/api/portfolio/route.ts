import {NextResponse} from "next/server";
import {chains} from "@/lib/chains";
import {catalogFor,popularTokens} from "@/lib/token-catalog";
import {getToken,fromBaseUnits} from "@/lib/token-addresses";
import {isSolanaAddress,SOLANA_MINTS} from "@/lib/solana";

const EVM_ADDRESS=/^0x[a-fA-F0-9]{40}$/;
const ZERO=/^0x0{40}$/i;
const RPC:Record<number,string|undefined>={
 1:process.env.ETHEREUM_RPC_URL||"https://endpoints.omniatech.io/v1/eth/mainnet/public",
 8453:process.env.BASE_RPC_URL||"https://mainnet.base.org",
 42161:process.env.ARBITRUM_RPC_URL||"https://arb1.arbitrum.io/rpc",
 10:process.env.OPTIMISM_RPC_URL||"https://mainnet.optimism.io",
 137:process.env.POLYGON_RPC_URL||"https://polygon.drpc.org",
 56:process.env.BSC_RPC_URL||"https://bsc-dataseed.bnbchain.org",
 43114:process.env.AVALANCHE_RPC_URL||"https://api.avax.network/ext/bc/C/rpc",
 59144:process.env.LINEA_RPC_URL||"https://rpc.linea.build",
 4663:process.env.ROBINHOOD_RPC_URL||"https://rpc.mainnet.chain.robinhood.com"
};
type Holding={symbol:string;name:string;amount:string;address?:string;logoURI?:string};
async function rpc(url:string,method:string,params:unknown[]){
 const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),cache:"no-store",signal:AbortSignal.timeout(8500)});
 if(!response.ok)throw new Error("Balance RPC unavailable");
 const body=await response.json();if(body.error||body.result===undefined)throw new Error("Balance RPC unavailable");return body.result;
}
function amount(value:unknown,decimals:number){if(typeof value!=="string"||!/^0x[0-9a-fA-F]+$/.test(value))return;return fromBaseUnits(BigInt(value).toString(),decimals)}
async function evmPortfolio(address:string,chainId:number):Promise<{holdings:Holding[];partial:boolean}>{
 const chain=chains.find(c=>c.id===chainId);const url=RPC[chainId];if(!chain||!url)throw new Error("Network is unavailable");
 const nativeValue=await rpc(url,"eth_getBalance",[address,"latest"]);
 const nativeAmount=amount(nativeValue,18);if(nativeAmount===undefined)throw new Error("Invalid native balance");
 const holdings:Holding[]=[{symbol:chain.native,name:chain.native,amount:nativeAmount}];
 let candidates:Awaited<ReturnType<typeof popularTokens>>=[];
 try{const catalog=await catalogFor(chainId);candidates=popularTokens(chainId,catalog.tokens).filter(token=>!ZERO.test(token.address)).slice(0,12)}catch{}
 if(!candidates.length){for(const symbol of ["USDC","USDT"]){const token=getToken(chainId,symbol);if(token)candidates.push({...token,name:symbol,sources:[]})}}
 const results=await Promise.allSettled(candidates.map(async token=>{
  const data="0x70a08231"+address.slice(2).toLowerCase().padStart(64,"0");
  const value=await rpc(url,"eth_call",[{to:token.address,data},"latest"]);const balance=amount(value,token.decimals);
  return balance&&BigInt(value)>0n?{symbol:token.symbol,name:token.name,amount:balance,address:token.address,logoURI:token.logoURI}:undefined;
 }));
 for(const result of results)if(result.status==="fulfilled"&&result.value)holdings.push(result.value);
 return {holdings,partial:results.some(result=>result.status==="rejected")};
}
async function solanaPortfolio(address:string):Promise<{holdings:Holding[];partial:boolean}>{
 const url=process.env.SOLANA_RPC_URL||process.env.NEXT_PUBLIC_SOLANA_RPC_URL||"https://api.mainnet-beta.solana.com";
 const balance=await rpc(url,"getBalance",[address,{commitment:"confirmed"}]);
 if(!Number.isSafeInteger(balance?.value)||balance.value<0)throw new Error("Invalid SOL balance");
 const holdings:Holding[]=[{symbol:"SOL",name:"Solana",amount:fromBaseUnits(String(balance.value),9)}];
 let partial=false;
 try{
  const accounts=await rpc(url,"getTokenAccountsByOwner",[address,{mint:SOLANA_MINTS.USDC.address},{encoding:"jsonParsed",commitment:"confirmed"}]);
  for(const item of accounts?.value??[]){const value=item?.account?.data?.parsed?.info?.tokenAmount?.amount;
   if(typeof value==="string"&&/^\d+$/.test(value)&&BigInt(value)>0n)holdings.push({symbol:"USDC",name:"USD Coin",address:SOLANA_MINTS.USDC.address,amount:fromBaseUnits(value,6)});
  }
 }catch{partial=true}
 return {holdings,partial};
}
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;const address=params.get("address")||"";const network=params.get("chainId")||"";
 if(network!=="solana"&&!/^\d+$/.test(network))return NextResponse.json({error:"Invalid network"},{status:400});
 const chainId=network==="solana"?"solana":Number(network);
 if(!chains.some(chain=>chain.id===chainId)||!(chainId==="solana"?isSolanaAddress(address):EVM_ADDRESS.test(address)))return NextResponse.json({error:"Invalid wallet or network"},{status:400});
 try{
  const data=chainId==="solana"?await solanaPortfolio(address):await evmPortfolio(address,chainId as number);
  return NextResponse.json({...data,network:chainId,scope:chainId==="solana"?"SOL and USDC":"Native asset and popular tokens"},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Could not load balances for this network. Try again shortly."},{status:502,headers:{"Cache-Control":"no-store"}})}
}
