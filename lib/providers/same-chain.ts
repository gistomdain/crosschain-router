import type {QuoteRequest} from "./types";import {lifiProvider} from "./lifi";import {relayProvider} from "./relay";import {describeSameChainQuote} from "./same-chain-meta";
export function isSameChain(input:QuoteRequest){return String(input.fromChain)===String(input.toChain)}
export async function getSameChainQuotes(input:QuoteRequest){
 if(!isSameChain(input))return[];
 const [lifi,relay]=await Promise.allSettled([lifiProvider.quote(input),relayProvider.quote(input)]);
 return [lifi.status==="fulfilled"&&lifi.value?describeSameChainQuote(lifi.value,input):null,relay.status==="fulfilled"?relay.value:null].filter((quote):quote is NonNullable<typeof quote>=>quote!==null);
}
