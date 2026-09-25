import {NextResponse} from "next/server";import {getLiveQuotes} from "@/lib/providers";import {getSameChainQuotes,isSameChain} from "@/lib/providers/same-chain";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 const body=await request.json().catch(()=>({}));const amountText=typeof body.amount==="string"?body.amount:"";if(amountText.length===0||amountText.length>80||!/^\d+(?:\.\d+)?$/.test(amountText))return NextResponse.json({error:"Invalid amount"},{status:400});const amount=Number(amountText);if(!Number.isFinite(amount)||amount<=0)return NextResponse.json({error:"Invalid amount"},{status:400});
 const expiresAt=new Date(Date.now()+30000).toISOString();
 const input={fromChain:body.fromChain??1,toChain:body.toChain??"solana",fromToken:body.fromToken??"USDC",toToken:body.toToken??"USDC",amount:amountText,userAddress:body.userAddress};const sameChain=isSameChain(input);
 try{const aggregate=sameChain?{quotes:await getSameChainQuotes(input),health:[]}:await getLiveQuotes(input);const live=aggregate.quotes;
 if(live.length)return NextResponse.json({mode:"live",routeType:sameChain?"swap":"cross-chain",requestedAt:new Date().toISOString(),providerHealth:aggregate.health,routes:live.map(q=>({id:q.id,provider:q.provider,receive:Number(q.receive),fee:q.feeUsd,eta:q.etaSeconds?formatEta(q.etaSeconds):"—",steps:q.steps,expiresAt:q.expiresAt??expiresAt,approvalTxs:q.approvalTxs??[],tx:q.tx,tracking:q.tracking}))});
 }catch(error){console.error("Live quote aggregation failed",error)}
 return NextResponse.json({mode:"unavailable",routeType:sameChain?"swap":"cross-chain",requestedAt:new Date().toISOString(),providerHealth:[],routes:[],error:sameChain?"No live same-chain swap route is currently available.":"No live cross-chain route is currently available. Try refreshing or choose another pair."});
}
function formatEta(seconds:number){return seconds<60?"~"+seconds+" sec":"~"+Math.ceil(seconds/60)+" min"}