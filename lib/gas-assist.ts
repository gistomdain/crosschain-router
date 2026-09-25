export type GasBalanceState="funded"|"low";
// Conservative UX thresholds only. They indicate a low native balance, not whether a specific transaction can pay gas.
const LOW_NATIVE_BALANCE_WEI:Record<number,bigint>={1:5_000_000_000_000_000n,8453:500_000_000_000_000n,42161:500_000_000_000_000n,10:500_000_000_000_000n,137:5_000_000_000_000_000n,56:2_000_000_000_000_000n};
export function lowNativeBalanceThreshold(chainId:number){return LOW_NATIVE_BALANCE_WEI[chainId]}
export function classifyNativeBalance(chainId:number,balance:bigint):GasBalanceState|undefined{const threshold=lowNativeBalanceThreshold(chainId);if(threshold===undefined)return undefined;return balance>threshold?"funded":"low"}
