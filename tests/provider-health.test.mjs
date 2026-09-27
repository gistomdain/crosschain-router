import {test} from "node:test";
import assert from "node:assert/strict";
import {quoteWithHealth} from "../lib/providers/health.ts";

test("Relay rate limiting is visible without hiding another provider's quote",async()=>{
 const input={fromChain:4663,toChain:4663,fromToken:"USDG",toToken:"ETH",amount:"100"};
 const relay={name:"Relay",async quote(){throw new Error("Relay rate limited")}};
 const lifi={name:"LI.FI",async quote(){return{id:"lifi",provider:"LI.FI",receive:"0.037",steps:[]}}};
 const [unavailable,available]=await Promise.all([quoteWithHealth(relay,input),quoteWithHealth(lifi,input)]);
 assert.equal(unavailable.health.reason,"rate-limited");
 assert.equal(unavailable.quote,null);
 assert.equal(available.quote.receive,"0.037");
});
