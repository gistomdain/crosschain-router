import {test} from "node:test";
import assert from "node:assert/strict";
import {describeSameChainQuote} from "../lib/providers/same-chain-meta.ts";

test("same-chain quote and preparation agree on route shape without changing the transaction",()=>{
 const input={fromChain:4663,toChain:4663,fromToken:"USDG",toToken:"ETH",amount:"10",userAddress:"0x000000000000000000000000000000000000dEaD"};
 const original={id:"lifi",provider:"LI.FI",receive:"0.003",steps:["4663","LI.FI","4663"],tx:{to:"0x0000000000000000000000000000000000000001",data:"0x1234"},routeMeta:{source:"LI.FI",execution:"swap-bridge"}};
 const quoted=describeSameChainQuote(original,input);
 const prepared=describeSameChainQuote({...original,receive:"0.00299"},input);
 assert.deepEqual(quoted.routeMeta,prepared.routeMeta);
 assert.deepEqual(quoted.routeMeta,{source:"LI.FI",execution:"swap"});
 assert.equal(prepared.tx,original.tx);
 assert.equal(original.routeMeta.execution,"swap-bridge");
});
