import {test} from "node:test";
import assert from "node:assert/strict";
import {formatTokenAmount} from "../lib/format-token-amount.ts";

test("a nonzero ETH quote stays visible below four decimal places",()=>{
 assert.equal(formatTokenAmount("0.0000123456789"),"0.00001234");
 assert.equal(formatTokenAmount("0.000000000000000001",2),"0.000000000000000001");
 assert.equal(formatTokenAmount("0.0000123456789",36),"0.0000123456789");
 assert.equal(formatTokenAmount("0"),"0");
 assert.equal(formatTokenAmount("1234.56789",2),"1,234.56");
});
