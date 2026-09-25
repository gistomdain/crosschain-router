import type {QuoteRequest} from "./types";import {lifiProvider} from "./lifi";
export function isSameChain(input:QuoteRequest){return String(input.fromChain)===String(input.toChain)}
export async function getSameChainQuotes(input:QuoteRequest){if(!isSameChain(input))return[];const settled=await Promise.allSettled([lifiProvider.quote(input)]);return settled.flatMap(r=>r.status==="fulfilled"&&r.value?[{...r.value,id:"lifi-swap",steps:[String(input.fromChain),"DEX aggregation",String(input.toChain)],routeMeta:{source:"LI.FI",execution:"swap",direct:true,hopCount:1}}]:[])}
