import {NextResponse} from "next/server";import {fromSolanaBaseUnits,getSolanaMint,parseSolanaAmount} from "@/lib/solana";
export const dynamic="force-dynamic";
const MAX_DETERIORATION_BPS=50;
export async function POST(request:Request){
 const body=await request.json().catch(()=>({}));
 if(!body.userPublicKey)return NextResponse.json({error:"Solana wallet is required"},{status:400});
 const input=getSolanaMint(String(body.fromToken||"")),output=getSolanaMint(String(body.toToken||""));
 if(!input||!output||input.address===output.address)return NextResponse.json({error:"Unsupported Solana token pair"},{status:400});
 const amount=parseSolanaAmount(String(body.amount||""),input.decimals);
 if(!amount)return NextResponse.json({error:"Invalid amount"},{status:400});
 const slippageBps=Math.min(300,Math.max(1,Number(body.slippageBps??50)||50));
 const headers:Record<string,string>={"content-type":"application/json",accept:"application/json"};
 if(process.env.JUPITER_API_KEY)headers["x-api-key"]=process.env.JUPITER_API_KEY;
 try{
  const qp=new URLSearchParams({inputMint:input.address,outputMint:output.address,amount,slippageBps:String(slippageBps)});
  const quoteController=new AbortController();const quoteTimer=setTimeout(()=>quoteController.abort(),8000);let qr:Response;try{qr=await fetch("https://api.jup.ag/swap/v1/quote?"+qp,{headers,cache:"no-store",signal:quoteController.signal})}finally{clearTimeout(quoteTimer)};
  if(!qr.ok)return NextResponse.json({error:"Fresh Jupiter quote unavailable"},{status:502});
  const quoteResponse=await qr.json();
  const freshReceive=Number(fromSolanaBaseUnits(String(quoteResponse.outAmount),output.decimals));
  const reviewedReceive=Number(body.reviewedReceive);
  const deteriorationBps=Number.isFinite(reviewedReceive)&&reviewedReceive>0?Math.max(0,Math.round((reviewedReceive-freshReceive)/reviewedReceive*10000)):0;
  if(deteriorationBps>MAX_DETERIORATION_BPS)return NextResponse.json({error:"Route changed materially. Review the fresh quote before signing.",freshReceive,deteriorationBps,requiresReconfirm:true},{status:409});
  const swapController=new AbortController();const swapTimer=setTimeout(()=>swapController.abort(),10000);let sr:Response;try{sr=await fetch("https://api.jup.ag/swap/v1/swap",{method:"POST",headers,body:JSON.stringify({quoteResponse,userPublicKey:body.userPublicKey,dynamicComputeUnitLimit:true,prioritizationFeeLamports:"auto"}),signal:swapController.signal})}finally{clearTimeout(swapTimer)};
  if(!sr.ok)return NextResponse.json({error:"Jupiter transaction preparation failed"},{status:502});
  const swap=await sr.json();
  if(!swap.swapTransaction)return NextResponse.json({error:"Jupiter returned no transaction"},{status:502});
  return NextResponse.json({provider:"Jupiter",swapTransaction:swap.swapTransaction,freshReceive,deteriorationBps,requiresReconfirm:false,lastValidBlockHeight:swap.lastValidBlockHeight,prioritizationFeeLamports:swap.prioritizationFeeLamports??null})
 }catch(e){if(e instanceof Error&&e.name==="AbortError")return NextResponse.json({error:"Solana route preparation timed out"},{status:504});return NextResponse.json({error:"Could not safely prepare the Solana swap"},{status:502})}
}
