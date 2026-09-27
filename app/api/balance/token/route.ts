import {NextResponse} from "next/server";
import {chains} from "@/lib/chains";
import {BALANCE_RPC,balanceRpc,solanaBalanceRpc} from "@/lib/balance-rpc";
import {fromBaseUnits,getToken} from "@/lib/token-addresses";
import {isSolanaAddress,SOLANA_MINTS} from "@/lib/solana";

const ADDRESS=/^0x[a-fA-F0-9]{40}$/;
const HEX=/^0x[0-9a-fA-F]+$/;
const ZERO=/^0x0{40}$/i;
const headers={"Cache-Control":"no-store"};
async function tokenPrice(chain:string,token:string){
 try{const response=await fetch(`https://li.quest/v1/token?chain=${encodeURIComponent(chain)}&token=${encodeURIComponent(token)}`,{next:{revalidate:60},signal:AbortSignal.timeout(3500)});
  if(!response.ok)return;const data=await response.json();
  if(typeof data.address!=="string"||data.address.toLowerCase()!==token.toLowerCase()||typeof data.priceUSD!=="string"||!/^\d+(?:\.\d+)?$/.test(data.priceUSD))return;
  const price=Number(data.priceUSD);return price>0&&Number.isFinite(price)?data.priceUSD:undefined;
 }catch{return undefined}
}
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 const chainValue=params.get("chainId")||"",address=params.get("address")||"",token=params.get("token")||"";
 const chainId=chainValue==="solana"?"solana":/^\d+$/.test(chainValue)?Number(chainValue):NaN;
 const chain=chains.find(c=>c.id===chainId);
 if(!chain||!(chainId==="solana"?isSolanaAddress(address):ADDRESS.test(address))||token.length>80)return NextResponse.json({error:"Invalid wallet, network, or token"},{status:400,headers});
 try{
  if(chainId==="solana"){
   if(token!=="SOL"&&token!=="USDC")return NextResponse.json({error:"Unsupported Solana asset"},{status:400,headers});
   let raw:bigint;
   if(token==="SOL"){
    const result=await balanceRpc(solanaBalanceRpc(),"getBalance",[address,{commitment:"confirmed"}]);
    if(!Number.isSafeInteger(result?.value)||result.value<0)throw new Error("Invalid SOL balance");raw=BigInt(result.value);
   }else{
    const result=await balanceRpc(solanaBalanceRpc(),"getTokenAccountsByOwner",[address,{mint:SOLANA_MINTS.USDC.address},{encoding:"jsonParsed",commitment:"confirmed"}]);
    if(!Array.isArray(result?.value))throw new Error("Invalid token accounts");raw=0n;
    for(const item of result.value){const amount=item?.account?.data?.parsed?.info?.tokenAmount?.amount;if(typeof amount!=="string"||!/^\d+$/.test(amount))throw new Error("Invalid token balance");raw+=BigInt(amount)}
   }
   const decimals=token==="SOL"?9:6;const priceUSD=await tokenPrice("SOL",SOLANA_MINTS[token].address);
   return NextResponse.json({balance:fromBaseUnits(raw.toString(),decimals),raw:raw.toString(),decimals,isNative:token==="SOL",priceUSD},{headers});
  }
  const url=BALANCE_RPC[chainId as number];if(!url)throw new Error("Network unavailable");
  const native=ZERO.test(token)||(!ADDRESS.test(token)&&token.toUpperCase()===chain.native.toUpperCase());
  let raw:bigint,decimals=18;let priceToken:string;
  if(native){priceToken="0x0000000000000000000000000000000000000000";const result=await balanceRpc(url,"eth_getBalance",[address,"latest"]);if(typeof result!=="string"||!HEX.test(result))throw new Error("Invalid balance");raw=BigInt(result)}
  else{
   const contract=ADDRESS.test(token)?token:getToken(chainId as number,token)?.address;
   if(!contract)return NextResponse.json({error:"Select this token from the live list to check its balance"},{status:400,headers});
   priceToken=contract;
   const [precision,result]=await Promise.all([balanceRpc(url,"eth_call",[{to:contract,data:"0x313ce567"},"latest"]),balanceRpc(url,"eth_call",[{to:contract,data:"0x70a08231"+address.slice(2).toLowerCase().padStart(64,"0")},"latest"])]);
   if(typeof precision!=="string"||!HEX.test(precision)||typeof result!=="string"||!HEX.test(result))throw new Error("Invalid token balance");
   decimals=Number(BigInt(precision));if(!Number.isInteger(decimals)||decimals<0||decimals>36)throw new Error("Invalid token decimals");raw=BigInt(result);
  }
  const priceUSD=await tokenPrice(String(chainId),priceToken);
  return NextResponse.json({balance:fromBaseUnits(raw.toString(),decimals),raw:raw.toString(),decimals,isNative:native,priceUSD},{headers});
 }catch{return NextResponse.json({error:"Could not load this token balance. Try again shortly."},{status:502,headers})}
}
