import type {NormalizedQuote,QuoteProvider,QuoteRequest} from "./types";
export const debridgeProvider:QuoteProvider={name:"deBridge",async quote(input:QuoteRequest):Promise<NormalizedQuote|null>{
 void input;return null;
}};