import {NextResponse} from "next/server";
const TERMINAL=["filled","expired","refunded"];
export async function GET(request:Request){const {searchParams}=new URL(request.url);const provider=searchParams.get("provider");const txHash=searchParams.get("txHash");
 if(!provider||!txHash)return NextResponse.json({error:"provider and txHash are required"},{status:400});
 if(provider.toLowerCase()==="across"){const key=process.env.ACROSS_API_KEY;if(!key)return NextResponse.json({provider,status:"submitted",terminal:false,note:"Across tracking requires server API credentials."});
  const params=new URLSearchParams({depositTxnRef:txHash});const res=await fetch("https://app.across.to/api/deposit/status?"+params,{headers:{Authorization:"Bearer "+key,accept:"application/json"},cache:"no-store"});
  if(res.status===404)return NextResponse.json({provider,status:"indexing",terminal:false});
  if(!res.ok)return NextResponse.json({provider,status:"submitted",terminal:false},{status:200});
  const data=await res.json();return NextResponse.json({provider,status:data.status??"pending",terminal:TERMINAL.includes(data.status),destinationTxHash:data.fillTxnRef??data.fillTx??null,refundTxHash:data.depositRefundTxnRef??data.depositRefundTxHash??null});
 }
 return NextResponse.json({provider,status:"submitted",terminal:false,note:"Provider-specific destination tracking is not enabled yet."});
}