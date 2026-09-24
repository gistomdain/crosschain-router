import type {NormalizedQuote} from "../providers/types";
export type RoutePreference="best-return"|"fastest"|"lowest-fee";
export function rankQuotes(quotes:NormalizedQuote[],preference:RoutePreference){
 return [...quotes].sort((a,b)=>{
  if(preference==="fastest")return (a.etaSeconds??Number.MAX_SAFE_INTEGER)-(b.etaSeconds??Number.MAX_SAFE_INTEGER);
  if(preference==="lowest-fee")return (a.feeUsd??Number.MAX_SAFE_INTEGER)-(b.feeUsd??Number.MAX_SAFE_INTEGER);
  return Number(b.receive)-Number(a.receive);
 });
}
export function quoteIsStale(quote:NormalizedQuote,now=Date.now()){return quote.expiresAt?new Date(quote.expiresAt).getTime()<=now:false;}