import type {NormalizedQuote,QuoteProvider,QuoteRequest} from "./types";
export const acrossProvider:QuoteProvider={name:"Across",async quote(input:QuoteRequest):Promise<NormalizedQuote|null>{
 void input;return null;
}};