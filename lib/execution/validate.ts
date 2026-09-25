import type {ProviderTransaction} from "@/lib/providers/types";
const ADDRESS=/^0x[a-fA-F0-9]{40}$/;const DATA=/^0x[a-fA-F0-9]*$/;
export type TxValidation={ok:boolean;warnings:string[];errors:string[]};
export function validateProviderTransaction(tx:ProviderTransaction|undefined,expectedChainId:number):TxValidation{
 const errors:string[]=[],warnings:string[]=[];if(!tx)return{ok:false,errors:["Selected route does not include an executable transaction."],warnings};
 if(!ADDRESS.test(tx.to))errors.push("Invalid transaction target.");if(!DATA.test(tx.data))errors.push("Invalid transaction calldata.");
 if(tx.chainId&&tx.chainId!==expectedChainId)errors.push("Transaction chain does not match the source chain.");
 if(!tx.data||tx.data==="0x")warnings.push("Transaction has empty calldata.");if(tx.value){try{if(BigInt(tx.value)<0n)errors.push("Invalid native value.")}catch{errors.push("Malformed native value.")}}
 return{ok:errors.length===0,errors,warnings};
}
export function summarizeCalldata(data?:string){if(!data||data.length<10)return "No function selector";return data.slice(0,10)+" · "+Math.max(0,(data.length-2)/2)+" bytes"}