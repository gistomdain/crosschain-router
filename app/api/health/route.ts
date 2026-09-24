import {NextResponse} from "next/server";
export async function GET(){return NextResponse.json({ok:true,service:"crosschain-router",version:"0.2.0",providers:["LI.FI","Relay","Across","deBridge"]})}