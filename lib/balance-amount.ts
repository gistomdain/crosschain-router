export type TokenBalance={balance:string;raw:string;decimals:number;isNative:boolean};
const nativeReserve:Record<string,string>={
 "1":"0.01","8453":"0.001","42161":"0.001","10":"0.001","137":"0.1",
 "56":"0.002","43114":"0.01","59144":"0.001","4663":"0.001",solana:"0.01"
};
function units(value:string,decimals:number){const [whole,fraction=""]=value.split(".");return BigInt(whole)*10n**BigInt(decimals)+BigInt((fraction+"0".repeat(decimals)).slice(0,decimals)||"0")}
function formatUnits(raw:bigint,decimals:number){const unit=10n**BigInt(decimals),whole=raw/unit,fraction=(raw%unit).toString().padStart(decimals,"0").replace(/0+$/,"");return fraction?`${whole}.${fraction}`:whole.toString()}
export function spendableRaw(balance:TokenBalance,chainId:number|string){
 const raw=BigInt(balance.raw);
 const reserve=balance.isNative?units(nativeReserve[String(chainId)]??"0.01",balance.decimals):0n;
 return raw>reserve?raw-reserve:0n;
}
export function amountForPercent(balance:TokenBalance,chainId:number|string,percent:25|50|100){
 const raw=spendableRaw(balance,chainId)*BigInt(percent)/100n;
 return formatUnits(raw,balance.decimals);
}
export function reservedGas(chainId:number|string){return nativeReserve[String(chainId)]??"0.01"}
