import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {acrossOutputAmount,exactTokenApproval,normalizeProviderTransaction} from "../lib/providers/normalize.ts";

const fixture=name=>JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`,import.meta.url),"utf8"));
const token="0x1111111111111111111111111111111111111111";

test("Across fixture selects the final destination step and source-chain transaction",()=>{
 const quote=fixture("across");
 assert.equal(acrossOutputAmount(quote),"980000");
 assert.equal(quote.steps.destinationSwap.minOutputAmount,"970000");
 assert.equal(normalizeProviderTransaction(quote.swapTx,8453)?.value,"0x0");
 assert.equal(normalizeProviderTransaction(quote.approvalTxns[0],8453)?.chainId,8453);
});
test("LI.FI and deBridge fixtures require explicit token spenders",()=>{
 const lifi=fixture("lifi"),debridge=fixture("debridge");
 assert.equal(lifi.estimate.toAmountMin,"990000");
 assert.ok(exactTokenApproval(token,lifi.estimate.approvalAddress,"1000000",8453));
 assert.ok(exactTokenApproval(token,debridge.tx.allowanceTarget,"1000000",8453));
 assert.equal(normalizeProviderTransaction(debridge.tx,8453)?.value,"0x0");
 assert.equal(exactTokenApproval(token,undefined,"1000000",8453),null);
});
test("Relay fixture retains minimum amount and rejects a destination-chain transaction",()=>{
 const relay=fixture("relay");
 assert.equal(relay.details.currencyOut.minimumAmount,"980000");
 const tx=relay.steps[0].items[0].data;
 assert.ok(normalizeProviderTransaction(tx,8453));
 assert.equal(normalizeProviderTransaction({...tx,chainId:42161},8453),null);
});
