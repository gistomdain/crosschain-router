export type Token={symbol:string;name:string;decimals:number;chains:(number|string)[]};
export const tokens:Token[]=[
{symbol:"USDC",name:"USD Coin",decimals:6,chains:[1,8453,42161,10,137,56,"solana"]},
{symbol:"USDT",name:"Tether USD",decimals:6,chains:[1,42161,10,137,56,"solana"]},
{symbol:"ETH",name:"Ether",decimals:18,chains:[1,8453,42161,10]},
{symbol:"SOL",name:"Solana",decimals:9,chains:["solana"]},
{symbol:"WBTC",name:"Wrapped Bitcoin",decimals:8,chains:[1,8453,42161,10,137]}];
export const tokensFor=(chain:number|string)=>tokens.filter(t=>t.chains.includes(chain));