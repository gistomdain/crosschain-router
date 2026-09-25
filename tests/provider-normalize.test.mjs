import {test} from "node:test";
import assert from "node:assert/strict";
import {acrossExpiry,acrossOutputAmount,exactTokenApproval,normalizeProviderTransaction} from "../lib/providers/normalize.ts";

const token="0x1111111111111111111111111111111111111111",spender="0x2222222222222222222222222222222222222222";
test("provider transactions normalize decimal values and reject chain mismatch",()=>{
 assert.deepEqual(normalizeProviderTransaction({to:spender,data:"0x1234",value:"1000000000000000000",chainId:8453},8453),{to:spender,data:"0x1234",value:"0xde0b6b3a7640000",chainId:8453});
 assert.equal(normalizeProviderTransaction({to:spender,data:"0x1234",value:"0",chainId:1},8453),null);
 assert.equal(normalizeProviderTransaction({to:spender,data:"0x123",value:"0"},8453),null);
 assert.equal(normalizeProviderTransaction({to:spender,data:"0x",value:"-1"},8453),null);
});
test("Across reads final destination amount and provider expiry",()=>{
 assert.equal(acrossOutputAmount({steps:{bridge:{outputAmount:"998000"}}}),"998000");
 assert.equal(acrossOutputAmount({steps:{bridge:{outputAmount:"998000"},destinationSwap:{outputAmount:"997000"}}}),"997000");
 assert.equal(acrossOutputAmount({steps:{bridge:{outputAmount:"0"}}}),null);
 assert.equal(acrossExpiry({quoteExpiryTimestamp:Math.floor(Date.now()/1000)-1}),null);
 assert.ok(acrossExpiry({quoteExpiryTimestamp:Math.floor(Date.now()/1000)+30}));
});
test("token approval permits only the exact requested amount",()=>{
 const tx=exactTokenApproval(token,spender,"1000000",8453);
 assert.equal(tx?.to,token);
 assert.equal(tx?.data.slice(0,10),"0x095ea7b3");
 assert.equal(BigInt("0x"+tx?.data.slice(74)),1000000n);
 assert.equal(exactTokenApproval(token,"0x0000000000000000000000000000000000000000","1000000",8453),null);
});
