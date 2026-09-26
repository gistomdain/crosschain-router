import {test} from "node:test";
import assert from "node:assert/strict";
import {verifyLiveQuotes} from "../scripts/validate-live-quotes.mjs";

const config={address:"0x1111111111111111111111111111111111111111",selection:{fromChain:8453,toChain:42161,fromToken:"USDC",toToken:"USDC"},amount:"1"};
test("read-only validation checks fresh executable routes without submitting transactions",async()=>{
 const calls=[];
 const result=await verifyLiveQuotes(async(path,body)=>{
  calls.push({path,body});
  if(path==="/api/quote")return{ok:true,status:200,data:{providerHealth:[{provider:"LI.FI",status:"healthy"}],routes:[{provider:"LI.FI",receive:"0.99",minReceive:"0.98"}]}};
  return{ok:true,status:200,data:{provider:"LI.FI",tx:{to:"0x2222222222222222222222222222222222222222",data:"0x1234"},approvalTxs:[],expiresAt:new Date(Date.now()+20000).toISOString()}};
 },config);
 assert.equal(result.results[0].executable,true);
 assert.equal(calls[1].body.reviewedMinReceive,"0.98");
 assert.deepEqual(calls.map(x=>x.path),["/api/quote","/api/prepare"]);
});
test("missing public wallet address is rejected before any network request",async()=>{
 await assert.rejects(()=>verifyLiveQuotes(()=>{throw Error("unexpected request")},{...config,address:undefined}),/public EVM wallet address/);
});
