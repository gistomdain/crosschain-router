const DECIMAL=/^\d+(?:\.\d+)?$/;
const SCALE=10n**18n;
export function decimalUnits(value:string):bigint{
 if(!DECIMAL.test(value)||value.length>120)throw new Error("Invalid destination amount");
 const [whole,fraction=""]=value.split(".");
 if(fraction.length>18)throw new Error("Destination amount precision exceeds 18 decimals");
 return BigInt(whole)*SCALE+BigInt(fraction.padEnd(18,"0"));
}
export function deteriorationBps(reviewed:string,fresh:string):number{
 const old=decimalUnits(reviewed),next=decimalUnits(fresh);
 if(old<=0n||next<=0n)throw new Error("Destination amount must be positive");
 if(next>=old)return 0;
 // Round up, so a change just over the configured limit is never treated as equal to it.
 return Number(((old-next)*10000n+old-1n)/old);
}
export function routeExpired(expiresAt:string|undefined,now=Date.now(),bufferMs=3000):boolean{
 return !!expiresAt&&(!Number.isFinite(Date.parse(expiresAt))||Date.parse(expiresAt)<=now+bufferMs);
}
type PreparedShape={receive:number|string;minReceive?:string;tx:{to:string;data:string;value?:string};approvalTxs:unknown[];routeMeta?:unknown;capabilities?:unknown};
export function samePreparedRoute(a:PreparedShape,b:PreparedShape):boolean{
 return a.tx.to.toLowerCase()===b.tx.to.toLowerCase()&&a.tx.data.toLowerCase()===b.tx.data.toLowerCase()&&String(a.tx.value??"0x0").toLowerCase()===String(b.tx.value??"0x0").toLowerCase()&&String(a.receive)===String(b.receive)&&a.minReceive===b.minReceive&&JSON.stringify(a.approvalTxs)===JSON.stringify(b.approvalTxs)&&JSON.stringify(a.routeMeta)===JSON.stringify(b.routeMeta)&&JSON.stringify(a.capabilities)===JSON.stringify(b.capabilities);
}
