import type {NormalizedQuote,QuoteRequest} from "./types";

export function describeSameChainQuote(quote:NormalizedQuote,input:QuoteRequest):NormalizedQuote{
 return {...quote,id:"lifi-swap",steps:[String(input.fromChain),"DEX aggregation",String(input.toChain)],routeMeta:{source:"LI.FI",execution:"swap"}};
}
