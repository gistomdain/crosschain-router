export type Chain={id:number|string;name:string;symbol:string;native:string;family:"evm"|"solana"};
export const chains:Chain[]=[
{id:1,name:"Ethereum",symbol:"Ξ",native:"ETH",family:"evm"},
{id:8453,name:"Base",symbol:"B",native:"ETH",family:"evm"},
{id:42161,name:"Arbitrum",symbol:"A",native:"ETH",family:"evm"},
{id:10,name:"Optimism",symbol:"O",native:"ETH",family:"evm"},
{id:137,name:"Polygon",symbol:"P",native:"POL",family:"evm"},
{id:56,name:"BNB Chain",symbol:"B",native:"BNB",family:"evm"},
{id:"solana",name:"Solana",symbol:"S",native:"SOL",family:"solana"}];
export const chainByName=(name:string)=>chains.find(c=>c.name===name)??chains[0];