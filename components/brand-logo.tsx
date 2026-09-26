import Image from "next/image";

const networkLogos:Record<string,string>={
 Ethereum:"ethereum",Base:"base",Arbitrum:"arbitrum",Optimism:"optimism",
 Polygon:"polygon","BNB Chain":"smartchain",Solana:"solana"
};
const tokenLogos:Record<string,string>={USDC:"usdc",USDT:"usdt",ETH:"ethereum",SOL:"solana",WBTC:"wbtc"};

export function BrandLogo({kind,name,className=""}:{kind:"network"|"token";name:string;className?:string}){
 const file=kind==="network"?networkLogos[name]:tokenLogos[name];
 if(!file)return null;
 return <Image className={className} src={`/logos/${file}.png`} alt="" width={32} height={32} unoptimized/>;
}
