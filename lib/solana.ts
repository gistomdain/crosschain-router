export const SOLANA_MINTS={
 SOL:{address:"So11111111111111111111111111111111111111112",decimals:9},
 USDC:{address:"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",decimals:6}
} as const;
export function getSolanaMint(symbol:string){return SOLANA_MINTS[symbol as keyof typeof SOLANA_MINTS]}
export function toSolanaBaseUnits(amount:string,decimals:number){const [whole="0",fraction=""]=amount.split(".");const padded=(fraction+"0".repeat(decimals)).slice(0,decimals);return(BigInt(whole||"0")*10n**BigInt(decimals)+BigInt(padded||"0")).toString()}
export function fromSolanaBaseUnits(amount:string,decimals:number){const n=BigInt(amount),base=10n**BigInt(decimals),whole=n/base;const fraction=(n%base).toString().padStart(decimals,"0").replace(/0+$/,"");return fraction?whole+"."+fraction:whole.toString()}
export function parseSolanaBaseUnits(value:unknown,decimals:number){if(typeof value!=="string"||value.length===0||value.length>80||!/^\d+$/.test(value)||decimals<0||!Number.isInteger(decimals))return null;try{return fromSolanaBaseUnits(value,decimals)}catch{return null}}
export function parseSolanaAmount(amount:string,decimals:number){if(amount.length===0||amount.length>80||!/^\d+(?:\.\d+)?$/.test(amount)||decimals<0||!Number.isInteger(decimals))return null;const [whole="0",fraction=""]=amount.split(".");if(fraction.length>decimals)return null;try{const value=toSolanaBaseUnits(amount,decimals);return BigInt(value)>0n?value:null}catch{return null}}

const BASE58="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function isSolanaAddress(value:unknown){if(typeof value!=="string"||value.length<32||value.length>44)return false;let n=0n;for(const ch of value){const digit=BASE58.indexOf(ch);if(digit<0)return false;n=n*58n+BigInt(digit)}let bytes=0;for(let x=n;x>0n;x>>=8n)bytes++;let leading=0;while(leading<value.length&&value[leading]==="1")leading++;return bytes+leading===32}
