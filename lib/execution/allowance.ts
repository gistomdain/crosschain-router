import type {ProviderTransaction} from "@/lib/providers/types";
const APPROVE="0x095ea7b3",ALLOWANCE="dd62ed3e";
const pad=(value:string)=>value.replace(/^0x/,"").padStart(64,"0");
export type ApprovalRequirement={tx:ProviderTransaction;token:string;spender:string;amount:bigint;standard:boolean};
export function decodeApproval(tx:ProviderTransaction):ApprovalRequirement{const data=tx.data?.toLowerCase()||"";if(!data.startsWith(APPROVE)||data.length<138)return{tx,token:tx.to,spender:"",amount:0n,standard:false};const spender="0x"+data.slice(34,74);const amount=BigInt("0x"+data.slice(74,138));return{tx,token:tx.to,spender,amount,standard:true}}
export function allowanceCall(token:string,owner:string,spender:string):ProviderTransaction{return{to:token,data:"0x"+ALLOWANCE+pad(owner)+pad(spender)}}
export function decodeUint256(value:string){return value&&value!=="0x"?BigInt(value):0n}
export async function filterRequiredApprovals(call:(tx:ProviderTransaction)=>Promise<string>,owner:string,approvals:ProviderTransaction[]){const required:ProviderTransaction[]=[];for(const tx of approvals){const decoded=decodeApproval(tx);if(!decoded.standard){required.push(tx);continue}try{const current=decodeUint256(await call(allowanceCall(decoded.token,owner,decoded.spender)));if(current<decoded.amount)required.push(tx)}catch{required.push(tx)}}return required}