import {NextResponse} from "next/server";
import {catalogFor,popularTokens} from "@/lib/token-catalog";
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;const chain=Number(params.get("chain"));const query=(params.get("q")??"").trim();
 if(!Number.isSafeInteger(chain)||query.length>80)return NextResponse.json({error:"Invalid token search"},{status:400});
 const catalog=await catalogFor(chain,query);
 if(!catalog.available)return NextResponse.json({error:"Token catalogs temporarily unavailable"},{status:503});
 const popular=query?[]:popularTokens(chain,catalog.tokens);
 const featuredAddresses=new Set(popular.map(t=>t.address.toLowerCase()));
 const ordered=[...popular,...catalog.tokens.filter(t=>!featuredAddresses.has(t.address.toLowerCase()))];
 return NextResponse.json({...catalog,total:ordered.length,popularCount:popular.length,tokens:ordered.slice(0,120)},{headers:{"Cache-Control":"public, s-maxage=120, stale-while-revalidate=300"}});
}
