#!/usr/bin/env node
const base=process.env.ROUTER_BASE_URL||"http://localhost:3000";
const address=process.env.ROUTER_TEST_WALLET;
const ADDRESS=/^0x[a-fA-F0-9]{40}$/;
const AMOUNT=/^\d+(?:\.\d+)?$/;
const source=Number(process.env.ROUTER_FROM_CHAIN||8453);
const destination=Number(process.env.ROUTER_TO_CHAIN||42161);
const fromToken=process.env.ROUTER_FROM_TOKEN||"USDC";
const toToken=process.env.ROUTER_TO_TOKEN||"USDC";
const amount=process.env.ROUTER_AMOUNT||"1";
const selection={fromChain:source,toChain:destination,fromToken,toToken};
const request=async(path,body)=>{
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),18000);
 try{const response=await fetch(new URL(path,base),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),signal:controller.signal});const json=await response.json();return{ok:response.ok,status:response.status,data:json}}
 finally{clearTimeout(timer)}
};
export async function verifyLiveQuotes(fetchRequest=request,config={address,selection,amount}){
 if(!ADDRESS.test(config.address||""))throw new Error("Set ROUTER_TEST_WALLET to a public EVM wallet address. Never provide a private key.");
 if(!Number.isSafeInteger(config.selection.fromChain)||!Number.isSafeInteger(config.selection.toChain)||!AMOUNT.test(config.amount)||!/[1-9]/.test(config.amount))throw new Error("Invalid live quote pair or amount.");
 const quote=await fetchRequest("/api/quote",{...config.selection,amount:config.amount,userAddress:config.address});
 if(!quote.ok)throw new Error(`Quote API returned HTTP ${quote.status}`);
 const health=Array.isArray(quote.data.providerHealth)?quote.data.providerHealth:[];
 const routes=Array.isArray(quote.data.routes)?quote.data.routes:[];
 const results=[];
 for(const route of routes){
  if(typeof route.provider!=="string"||typeof route.receive!=="string")continue;
  const prepared=await fetchRequest("/api/prepare",{provider:route.provider,...config.selection,amount:config.amount,userAddress:config.address,reviewedReceive:route.receive,reviewedMinReceive:route.minReceive});
  const valid=prepared.ok&&prepared.data?.provider===route.provider&&typeof prepared.data?.tx?.to==="string"&&ADDRESS.test(prepared.data.tx.to)&&typeof prepared.data?.tx?.data==="string"&&Array.isArray(prepared.data?.approvalTxs)&&prepared.data?.expiresAt&&Date.parse(prepared.data.expiresAt)>Date.now()+3000;
  results.push({provider:route.provider,executable:!!valid,status:prepared.status,reason:valid?undefined:String(prepared.data?.error||"Invalid prepared response").slice(0,120)});
 }
 return{health:health.map(x=>({provider:x.provider,status:x.status,reason:x.reason})),routes:routes.length,results};
}
if(process.argv[1]&&new URL(`file://${process.argv[1]}`).href===import.meta.url){
 verifyLiveQuotes().then(result=>{console.log(JSON.stringify(result,null,2));if(!result.results.some(x=>x.executable))process.exitCode=1}).catch(e=>{console.error(e instanceof Error?e.message:"Live quote check failed");process.exitCode=1});
}
