import type {NormalizedQuote,QuoteProvider,QuoteRequest} from "./types";
export const lifiProvider:QuoteProvider={name:"LI.FI",async quote(input:QuoteRequest):Promise<NormalizedQuote|null>{
 const key=process.env.LIFI_API_KEY;if(!key)return null;
 // Live adapter scaffold. Address resolution is added when token registry moves to canonical addresses.
 void input;return null;
}};