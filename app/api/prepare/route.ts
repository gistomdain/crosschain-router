import {NextResponse} from "next/server";import {getProvider} from "@/lib/providers";import {validateProviderTransaction} from "@/lib/execution/validate";import {isApprovalTransaction} from "@/lib/execution/simulate";import {decodeApproval} from "@/lib/execution/allowance";import {getToken,toBaseUnits} from "@/lib/token-addresses";import {validateProviderRelationship} from "@/lib/execution/provider-relationship";
export const dynamic="force-dynamic";
const MAX_APPROVALS=2,MAX_APPROVAL_BUFFER_BPS=100n;const ADDRESS=/^0x[a-fA-F0-9]{40}$/;
export async function POST(request:Request){
 const body=await request.json().catch(()=>({}));const amount=Number(body.amount);
 if(!Number.isFinite(amount)||amount<=0||!body.provider||!body.userAddress)return NextResponse.json({error:"Invalid preparation request"},{status:400});
 const provider=getProvider(String(body.provider));if(!provider)return NextResponse.json({error:"Unknown provider"},{status:404});
 const input={fromChain:body.fromChain,toChain:body.toChain,fromToken:String(body.fromToken),toToken:String(body.toToken),amount:String(body.amount),userAddress:String(body.userAddress)};
 if(typeof input.fromChain!=="number")return NextResponse.json({error:"EVM preparation requires a numeric source chain"},{status:400});
 try{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);let quote;try{quote=await provider.quote(input,controller.signal)}finally{clearTimeout(timer)}
  if(!quote||!quote.tx)return NextResponse.json({error:"Fresh executable quote unavailable"},{status:409});
  const relationship=validateProviderRelationship(quote);if(!relationship.ok)return NextResponse.json({error:"Provider transaction relationship failed validation",details:relationship.errors},{status:422});
  const validation=validateProviderTransaction(quote.tx,input.fromChain);
  if(!validation.ok)return NextResponse.json({error:"Provider transaction failed validation",details:validation.errors},{status:422});
  const approvals=quote.approvalTxs??[];const sourceToken=getToken(input.fromChain,input.fromToken);let expectedApproval:bigint|undefined;
  if(sourceToken){try{expectedApproval=BigInt(toBaseUnits(input.amount,sourceToken.decimals))}catch{return NextResponse.json({error:"Invalid source token amount"},{status:400})}}
  if(approvals.length&&!sourceToken)return NextResponse.json({error:"Cannot verify approval for this source token"},{status:422});
  if(approvals.length>MAX_APPROVALS)return NextResponse.json({error:"Route requires an unexpected number of approvals"},{status:422});
  for(const approval of approvals){
   const check=validateProviderTransaction(approval,input.fromChain);const decoded=decodeApproval(approval);
   if(!check.ok||!isApprovalTransaction(approval)||!decoded.standard)return NextResponse.json({error:"Provider approval transaction failed validation",details:check.errors},{status:422});
   if(decoded.amount<=0n)return NextResponse.json({error:"Provider requested an invalid token approval amount"},{status:422});
   if(!ADDRESS.test(decoded.spender)||/^0x0{40}$/i.test(decoded.spender))return NextResponse.json({error:"Provider requested an invalid approval spender"},{status:422});
   if(sourceToken&&decoded.token.toLowerCase()!==sourceToken.address.toLowerCase())return NextResponse.json({error:"Provider requested approval for an unexpected token"},{status:422});
   if(quote.approvalPolicy?.token&&decoded.token.toLowerCase()!==quote.approvalPolicy.token.toLowerCase())return NextResponse.json({error:"Approval token does not match provider allowance policy"},{status:422});
   if(quote.approvalPolicy?.spender&&decoded.spender.toLowerCase()!==quote.approvalPolicy.spender.toLowerCase())return NextResponse.json({error:"Approval spender does not match provider allowance policy"},{status:422});
   if(quote.approvalPolicy?.expectedAmount){try{if(decoded.amount<BigInt(quote.approvalPolicy.expectedAmount))return NextResponse.json({error:"Approval amount is below provider execution requirement"},{status:422})}catch{return NextResponse.json({error:"Provider returned malformed approval policy"},{status:422})}}
   if(expectedApproval){const maximum=expectedApproval+(expectedApproval*MAX_APPROVAL_BUFFER_BPS/10000n);if(decoded.amount>maximum)return NextResponse.json({error:"Provider requested an unnecessarily large token approval"},{status:422});}
  }
  if(quote.expiresAt&&Date.parse(quote.expiresAt)<=Date.now()+3000)return NextResponse.json({error:"Fresh route expired before signing"},{status:409});
  const reviewed=Number(body.reviewedReceive||0),fresh=Number(quote.receive);
  if(!Number.isFinite(fresh)||fresh<=0)return NextResponse.json({error:"Provider returned an invalid destination amount"},{status:502});
  const deteriorationBps=reviewed>0&&fresh<reviewed?((reviewed-fresh)/reviewed)*10000:0;
  const max=Math.min(300,Math.max(1,Number(body.maxDeteriorationBps??30)||30));
  if(deteriorationBps>max)return NextResponse.json({error:"Route changed materially. Review the fresh quote before signing.",receive:fresh,deteriorationBps,requiresReconfirm:true},{status:409});
  return NextResponse.json({provider:quote.provider,receive:fresh,fee:quote.feeUsd??0,etaSeconds:quote.etaSeconds,expiresAt:quote.expiresAt,approvalTxs:approvals,tx:quote.tx,tracking:quote.tracking,deteriorationBps,requiresReconfirm:false})
 }catch(e){if(e instanceof Error&&e.name==="AbortError")return NextResponse.json({error:"Route preparation timed out"},{status:504});return NextResponse.json({error:"Could not safely prepare the selected route"},{status:502})}
}
