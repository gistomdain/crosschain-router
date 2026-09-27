import type {QuoteRequest} from "./types";import {lifiProvider} from "./lifi";import {relayProvider} from "./relay";import {describeSameChainQuote} from "./same-chain-meta";import {quoteWithHealth} from "./health";
export function isSameChain(input:QuoteRequest){return String(input.fromChain)===String(input.toChain)}
export async function getSameChainQuotes(input:QuoteRequest){
 if(!isSameChain(input))return{quotes:[],health:[]};
 const [lifi,relay]=await Promise.all([quoteWithHealth(lifiProvider,input),quoteWithHealth(relayProvider,input)]);
 return{quotes:[lifi.quote?describeSameChainQuote(lifi.quote,input):null,relay.quote].filter((quote):quote is NonNullable<typeof quote>=>quote!==null),health:[lifi.health,relay.health]};
}
