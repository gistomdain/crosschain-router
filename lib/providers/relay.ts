import type {NormalizedQuote,QuoteProvider,QuoteRequest} from "./types";
export const relayProvider:QuoteProvider={name:"Relay",async quote(input:QuoteRequest):Promise<NormalizedQuote|null>{
 void input;return null;
}};