import {test} from "node:test";
import assert from "node:assert/strict";
import {deteriorationBps,routeExpired,samePreparedRoute} from "../lib/execution/route-protection.ts";

test("deterioration enforces the threshold without decimal rounding gaps",()=>{
 assert.equal(deteriorationBps("100","99.7"),30);
 assert.equal(deteriorationBps("100","99.699999999999999999"),31);
 assert.equal(deteriorationBps("100","101"),0);
 assert.equal(deteriorationBps("0.000000000000000002","0.000000000000000001"),5000);
 assert.throws(()=>deteriorationBps("1","0"));
 assert.throws(()=>deteriorationBps("1","0.1234567890123456789"));
});

test("expiry includes the wallet-signing safety window",()=>{
 const now=1_700_000_000_000;
 assert.equal(routeExpired(new Date(now+3000).toISOString(),now),true);
 assert.equal(routeExpired(new Date(now+3001).toISOString(),now),false);
 assert.equal(routeExpired("invalid",now),true);
});

test("changed output, transaction, and approvals require another review",()=>{
 const old={receive:"100",tx:{to:"0xabc",data:"0x1234",value:"0x0"},approvalTxs:[],routeMeta:{source:"Bridge"}};
 assert.equal(samePreparedRoute(old,{...old,tx:{...old.tx,to:"0xAbC"}}),true);
 assert.equal(samePreparedRoute(old,{...old,receive:"99"}),false);
 assert.equal(samePreparedRoute(old,{...old,tx:{...old.tx,data:"0x5678"}}),false);
 assert.equal(samePreparedRoute(old,{...old,approvalTxs:[{to:"0xdef"}]}),false);
});
