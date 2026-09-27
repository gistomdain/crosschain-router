import {test} from "node:test";
import assert from "node:assert/strict";
import {amountForFiftyUSD,amountForPercent,spendableRaw} from "../lib/balance-amount.ts";

test("token shortcuts preserve exact units without rounding up",()=>{
 const balance={balance:"1.000001",raw:"1000001",decimals:6,isNative:false};
 assert.equal(amountForPercent(balance,8453,25),"0.25");
 assert.equal(amountForPercent(balance,8453,50),"0.5");
 assert.equal(amountForPercent(balance,8453,100),"1.000001");
});
test("fixed USD shortcut uses price and refuses amounts beyond the balance",()=>{
 const balance={balance:"100",raw:"100000000",decimals:6,isNative:false,priceUSD:"2"};
 assert.equal(amountForFiftyUSD(balance,8453),"25");
 assert.equal(amountForFiftyUSD({...balance,raw:"24000000"},8453),undefined);
 assert.equal(amountForFiftyUSD({...balance,priceUSD:"0"},8453),undefined);
});
test("native max leaves gas and never exceeds the spendable balance",()=>{
 const balance={balance:"0.0015",raw:"1500000000000000",decimals:18,isNative:true};
 assert.equal(spendableRaw(balance,8453),500000000000000n);
 assert.equal(amountForPercent(balance,8453,100),"0.0005");
 assert.equal(amountForPercent(balance,8453,50),"0.00025");
 assert.equal(amountForPercent({...balance,raw:"999999999999999"},8453,100),"0");
});
