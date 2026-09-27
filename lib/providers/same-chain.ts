import type {QuoteRequest} from "./types";import {lifiProvider} from "./lifi";import {describeSameChainQuote} from "./same-chain-meta";
export function isSameChain(input:QuoteRequest){return String(input.fromChain)===String(input.toChain)}
export async function getSameChainQuotes(input:QuoteRequest){if(!isSameChain(input))return[];const settled=await Promise.allSettled([lifiProvider.quote(input)]);return settled.flatMap(r=>r.status==="fulfilled"&&r.value?[describeSameChainQuote(r.value,input)]:[])}
