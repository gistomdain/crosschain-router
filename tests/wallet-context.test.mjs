import {test} from "node:test";
import assert from "node:assert/strict";
import {assertWalletContext} from "../lib/execution/wallet-context.ts";

const address="0x1234567890123456789012345678901234567890";
test("wallet submission is bound to the reviewed account and source chain",()=>{
 assert.doesNotThrow(()=>assertWalletContext("0x2105",[address.toUpperCase()],8453,address,8453));
 assert.throws(()=>assertWalletContext("0x1",[address],8453,address),/network changed/);
 assert.throws(()=>assertWalletContext("0x2105",[address],8453,address,1),/network changed/);
 assert.throws(()=>assertWalletContext("0x2105",["0x0000000000000000000000000000000000000001"],8453,address),/account changed/);
});
