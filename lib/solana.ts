export const SOLANA_MINTS={
 SOL:{address:"So11111111111111111111111111111111111111112",decimals:9},
 USDC:{address:"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",decimals:6},
 USDT:{address:"Es9vMFrzaCERmJfrF4H2FYD4K9H8NfR4x7kKXnYk3a5",decimals:6}
} as const;
export function getSolanaMint(symbol:string){return SOLANA_MINTS[symbol as keyof typeof SOLANA_MINTS]}
export function toSolanaBaseUnits(amount:string,decimals:number){const [whole="0",fraction=""]=amount.split(".");const padded=(fraction+"0".repeat(decimals)).slice(0,decimals);return(BigInt(whole||"0")*10n**BigInt(decimals)+BigInt(padded||"0")).toString()}
export function fromSolanaBaseUnits(amount:string,decimals:number){const n=BigInt(amount),base=10n**BigInt(decimals),whole=n/base;const fraction=(n%base).toString().padStart(decimals,"0").replace(/0+$/,"");return fraction?whole+"."+fraction:whole.toString()}