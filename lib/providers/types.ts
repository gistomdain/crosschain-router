export type QuoteRequest={fromChain:number|string;toChain:number|string;fromToken:string;toToken:string;amount:string;userAddress?:string};
export type ProviderTransaction={to:string;data:string;value?:string;chainId?:number};
export type ProviderTracking={orderId?:string;requestId?:string;routeId?:string};
export type NormalizedQuote={id:string;provider:string;receive:string;feeUsd?:number;etaSeconds?:number;steps:string[];expiresAt?:string;approvalTxs?:ProviderTransaction[];tx?:ProviderTransaction;tracking?:ProviderTracking;approvalPolicy?:{token?:string;spender?:string;expectedAmount?:string};raw?:unknown};
export interface QuoteProvider{name:string;quote(input:QuoteRequest):Promise<NormalizedQuote|null>}