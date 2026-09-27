import {fromBaseUnits} from "@/lib/token-addresses";

export const BALANCE_RPC:Record<number,string|undefined>={
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
export const solanaBalanceRpc=()=>process.env.SOLANA_RPC_URL||process.env.NEXT_PUBLIC_SOLANA_RPC_URL||"https://api.mainnet-beta.solana.com";
export async function balanceRpc(url:string,method:string,params:unknown[]){
 const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),cache:"no-store",signal:AbortSignal.timeout(8500)});
 if(!response.ok)throw new Error("Balance RPC unavailable");
 const body=await response.json();if(body.error||body.result===undefined)throw new Error("Balance RPC unavailable");return body.result;
}
export function hexAmount(value:unknown,decimals:number){if(typeof value!=="string"||!/^0x[0-9a-fA-F]+$/.test(value))return;return fromBaseUnits(BigInt(value).toString(),decimals)}
