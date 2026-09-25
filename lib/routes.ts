import type {ProviderTransaction} from "@/lib/providers/types";
export type RouteQuote={id:string;provider:string;receive:number;fee:number;eta:string;label?:string;steps:string[];expiresAt?:string;approvalTxs?:ProviderTransaction[];tx?:ProviderTransaction};
export const demoRoutes:RouteQuote[]=[
{id:"relay",provider:"Relay",receive:997.84,fee:2.16,eta:"~4 sec",label:"BEST RETURN",steps:["Ethereum","Relay","Solana"]},
{id:"across",provider:"Across",receive:997.72,fee:2.28,eta:"~2 sec",label:"FASTEST",steps:["Ethereum","Across","Solana"]},
{id:"lifi",provider:"LI.FI",receive:997.55,fee:2.45,eta:"~8 sec",label:"LOWEST GAS",steps:["Ethereum","LI.FI","Solana"]},
{id:"debridge",provider:"deBridge",receive:997.41,fee:2.59,eta:"~5 sec",steps:["Ethereum","deBridge","Solana"]}]