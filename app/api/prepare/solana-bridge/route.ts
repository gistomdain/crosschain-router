import {NextResponse} from "next/server";
import {getRelaySolanaQuote,type SolanaBridgeInput} from "@/lib/providers/relay-solana";
import {deteriorationBps} from "@/lib/execution/route-protection";
export const dynamic="force-dynamic";
export async function POST(request:Request){const body=await request.json().catch(()=>({}));const input:SolanaBridgeInput={fromToken:String(body.fromToken??""),toToken:String(body.toToken??""),toChain:Number(body.toChain),amount:String(body.amount??""),sourceAddress:String(body.userAddress??""),destinationAddress:String(body.destinationAddress??"")};
 if(!Number.isSafeInteger(input.toChain))return NextResponse.json({error:"Choose an EVM destination"},{status:400});
 try{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);let quote;try{quote=await getRelaySolanaQuote(input,controller.signal)}finally{clearTimeout(timer)}
 if(!quote)return NextResponse.json({error:"Fresh executable Solana bridge route unavailable"},{status:409});
 let deterioration:number;try{deterioration=Math.max(deteriorationBps(String(body.reviewedReceive),quote.receive),deteriorationBps(String(body.reviewedMinReceive),quote.minReceive))}catch{return NextResponse.json({error:"Review a fresh bridge quote"},{status:409})}
 if(deterioration>30)return NextResponse.json({error:"Bridge output changed. Refresh and review the quote before signing.",requiresReconfirm:true},{status:409});
 return NextResponse.json(quote)
 }catch{return NextResponse.json({error:"Could not prepare the Solana bridge"},{status:502})}}
