import {NextResponse} from "next/server";
import {getRelaySolanaQuote,type SolanaBridgeInput} from "@/lib/providers/relay-solana";
export const dynamic="force-dynamic";
export async function POST(request:Request){const body=await request.json().catch(()=>({}));const input:SolanaBridgeInput={fromToken:String(body.fromToken??""),toToken:String(body.toToken??""),toChain:Number(body.toChain),amount:String(body.amount??""),sourceAddress:String(body.userAddress??""),destinationAddress:String(body.destinationAddress??"")};
 if(!Number.isSafeInteger(input.toChain))return NextResponse.json({error:"Choose an EVM destination"},{status:400});
 try{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);let quote;try{quote=await getRelaySolanaQuote(input,controller.signal)}finally{clearTimeout(timer)}
 if(!quote)return NextResponse.json({mode:"unavailable",routes:[],requestedAt:new Date().toISOString(),error:"No executable Solana bridge route for this pair."});
 return NextResponse.json({mode:"live",routeType:"cross-chain",requestedAt:new Date().toISOString(),routes:[{id:"relay-solana",provider:"Relay",receive:quote.receive,minReceive:quote.minReceive,fee:quote.fee,eta:quote.eta,steps:["Solana","Relay",String(input.toChain)],expiresAt:quote.expiresAt,tracking:{requestId:quote.requestId},routeMeta:{source:"Relay",execution:"solver",hopCount:1}}]})
 }catch{return NextResponse.json({error:"Solana bridge quote unavailable"},{status:502})}}
