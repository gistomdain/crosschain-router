import {NextResponse} from "next/server";import {getProvider} from "@/lib/providers";import {validateProviderTransaction} from "@/lib/execution/validate";import {isApprovalTransaction} from "@/lib/execution/simulate";import {decodeApproval} from "@/lib/execution/allowance";import {getToken,toBaseUnits} from "@/lib/token-addresses";import {validateProviderRelationship} from "@/lib/execution/provider-relationship";import {decimalUnits,deteriorationBps as calculateDeterioration,routeExpired} from "@/lib/execution/route-protection";
export const dynamic="force-dynamic";
const MAX_APPROVALS=2,MAX_APPROVAL_BUFFER_BPS=100n;const ADDRESS=/^0x[a-fA-F0-9]{40}$/;
export async function POST(request:Request){
 const body=await request.json().catch(()=>({}));const amountText=typeof body.amount==="string"?body.amount:"";
 if(amountText.length===0||amountText.length>80||!/^\d+(?:\.\d+)?$/.test(amountText)||!body.provider||!body.userAddress)return NextResponse.json({error:"Invalid preparation request"},{status:400});
 if(!/[1-9]/.test(amountText))return NextResponse.json({error:"Invalid preparation amount"},{status:400});
 if(!ADDRESS.test(String(body.userAddress)))return NextResponse.json({error:"Invalid EVM wallet address"},{status:400});
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
  if(quote.expiresAt){if(!Number.isFinite(Date.parse(quote.expiresAt)))return NextResponse.json({error:"Provider returned malformed route expiry"},{status:502});if(routeExpired(quote.expiresAt))return NextResponse.json({error:"Fresh route expired before signing"},{status:409});}
  // Providers without an expiry still need a bounded signing window.
  const expiresAt=quote.expiresAt??new Date(Date.now()+15000).toISOString();
  const receiveText=String(quote.receive),reviewedText=String(body.reviewedReceive??"");let deteriorationBps:number;
  try{calculateDeterioration(receiveText,receiveText)}catch{return NextResponse.json({error:"Provider returned an invalid destination amount"},{status:502})}
  try{deteriorationBps=calculateDeterioration(reviewedText,receiveText)}catch{return NextResponse.json({error:"Invalid reviewed route amount"},{status:400})}
  const fresh=receiveText;const minReceive=quote.minReceive===undefined?undefined:String(quote.minReceive);
  if(minReceive!==undefined){try{if(decimalUnits(minReceive)<=0n||decimalUnits(minReceive)>decimalUnits(receiveText))throw new Error("Invalid minimum")}catch{return NextResponse.json({error:"Provider returned an invalid minimum destination amount"},{status:502})}}
  const reviewedMin=body.reviewedMinReceive===undefined?undefined:String(body.reviewedMinReceive);
  if(reviewedMin!==undefined){if(minReceive===undefined)return NextResponse.json({error:"Route minimum disappeared. Review a fresh quote.",requiresReconfirm:true},{status:409});try{deteriorationBps=Math.max(deteriorationBps,calculateDeterioration(reviewedMin,minReceive))}catch{return NextResponse.json({error:"Invalid reviewed minimum destination amount"},{status:400})}}
  const max=Math.min(300,Math.max(1,Number(body.maxDeteriorationBps??30)||30));
  if(deteriorationBps>max)return NextResponse.json({error:"Route changed materially. Review the fresh quote before signing.",receive:fresh,deteriorationBps,requiresReconfirm:true},{status:409});
  const fee=typeof quote.feeUsd==="number"&&Number.isFinite(quote.feeUsd)&&quote.feeUsd>=0?quote.feeUsd:undefined;const etaSeconds=typeof quote.etaSeconds==="number"&&Number.isFinite(quote.etaSeconds)&&quote.etaSeconds>0?quote.etaSeconds:undefined;
  const routeMeta=quote.routeMeta;if(routeMeta!==undefined){if(typeof routeMeta!=="object"||routeMeta===null)return NextResponse.json({error:"Provider returned malformed route metadata"},{status:502});if(routeMeta.direct!==undefined&&typeof routeMeta.direct!=="boolean")return NextResponse.json({error:"Provider returned malformed route metadata"},{status:502});if(routeMeta.source!==undefined&&(typeof routeMeta.source!=="string"||routeMeta.source.length===0||routeMeta.source.length>80))return NextResponse.json({error:"Provider returned malformed route metadata"},{status:502});if(routeMeta.execution!==undefined&&!(["swap","bridge","swap-bridge","solver","multi-hop"] as const).includes(routeMeta.execution))return NextResponse.json({error:"Provider returned malformed route metadata"},{status:502});if(routeMeta.hopCount!==undefined&&(!Number.isInteger(routeMeta.hopCount)||routeMeta.hopCount<1||routeMeta.hopCount>20))return NextResponse.json({error:"Provider returned malformed route metadata"},{status:502})}
  const tracking=quote.tracking;if(tracking!==undefined){if(typeof tracking!=="object"||tracking===null)return NextResponse.json({error:"Provider returned malformed tracking metadata"},{status:502});for(const key of ["orderId","requestId","routeId"] as const){const value=tracking[key];if(value!==undefined&&(typeof value!=="string"||value.length===0||value.length>160))return NextResponse.json({error:"Provider returned malformed tracking metadata"},{status:502})}}
  return NextResponse.json({provider:quote.provider,receive:fresh,minReceive,fee,etaSeconds,expiresAt,approvalTxs:approvals,tx:quote.tx,tracking,capabilities:quote.capabilities,routeMeta,deteriorationBps,requiresReconfirm:false})
 }catch(e){if(e instanceof Error&&e.name==="AbortError")return NextResponse.json({error:"Route preparation timed out"},{status:504});return NextResponse.json({error:"Could not safely prepare the selected route"},{status:502})}
}
