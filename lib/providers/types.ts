export type QuoteRequest={fromChain:number|string;toChain:number|string;fromToken:string;toToken:string;amount:string;userAddress?:string};
export type ProviderTransaction={to:string;data:string;value?:string;chainId?:number};
export type NormalizedQuote={id:string;provider:string;receive:string;feeUsd?:number;etaSeconds?:number;steps:string[];expiresAt?:string;tx?:ProviderTransaction;raw?:unknown};
export interface QuoteProvider{name:string;quote(input:QuoteRequest):Promise<NormalizedQuote|null>}