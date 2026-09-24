import {NextResponse} from "next/server";import {demoRoutes} from "@/lib/routes";import {getLiveQuotes} from "@/lib/providers";import {getSameChainQuotes,isSameChain} from "@/lib/providers/same-chain";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 const body=await request.json().catch(()=>({}));const amount=Number(body.amount||0);if(!Number.isFinite(amount)||amount<=0)return NextResponse.json({error:"Invalid amount"},{status:400});
 const expiresAt=new Date(Date.now()+30000).toISOString();
 try{const input={fromChain:body.fromChain??1,toChain:body.toChain??"solana",fromToken:body.fromToken??"USDC",toToken:body.toToken??"USDC",amount:String(body.amount),userAddress:body.userAddress};const sameChain=isSameChain(input);const live=sameChain?await getSameChainQuotes(input):await getLiveQuotes(input);
 if(live.length)return NextResponse.json({mode:"live",routeType:sameChain?"swap":"cross-chain",requestedAt:new Date().toISOString(),routes:live.map(q=>({id:q.id,provider:q.provider,receive:Number(q.receive),fee:q.feeUsd??0,eta:q.etaSeconds?formatEta(q.etaSeconds):"—",steps:q.steps,expiresAt:q.expiresAt??expiresAt,approvalTxs:q.approvalTxs??[],tx:q.tx}))});
 }catch(error){console.error("Live quote aggregation failed",error)}
 if(sameChain)return NextResponse.json({mode:"unavailable",routeType:"swap",requestedAt:new Date().toISOString(),routes:[],error:"No live same-chain swap route is currently available."});
 const scale=amount/1000;return NextResponse.json({mode:"demo",routeType:"cross-chain",requestedAt:new Date().toISOString(),routes:demoRoutes.map(r=>({...r,receive:Number((r.receive*scale).toFixed(4)),fee:Number((r.fee*scale).toFixed(4)),expiresAt}))});
}
function formatEta(seconds:number){return seconds<60?"~"+seconds+" sec":"~"+Math.ceil(seconds/60)+" min"}