export type QuoteSnapshot={id:string;provider:string;receive:number|string;fee?:number;capturedAt:number};
export type RouteChange={kind:"better-route"|"selected-improved"|"selected-worsened";previous:QuoteSnapshot;next:QuoteSnapshot;delta:number;deltaBps:number};
const scaled=(value:number|string)=>{const text=String(value);if(!/^\\d+(?:\\.\\d+)?$/.test(text))return null;const [whole,fraction=""]=text.split(".");try{return{whole:BigInt(whole),fraction,scale:10n**BigInt(fraction.length)}}catch{return null}};
const exactBps=(a:number|string,b:number|string)=>{const x=scaled(a),y=scaled(b);if(!x||!y)return null;const scale=x.scale>y.scale?x.scale:y.scale;const xv=x.whole*scale+BigInt(x.fraction||"0")*(scale/x.scale);const yv=y.whole*scale+BigInt(y.fraction||"0")*(scale/y.scale);if(xv<=0n)return null;const delta=yv>=xv?yv-xv:xv-yv;return Number(delta*10000n/xv)};
const receiveNumber=(value:number|string)=>{const n=Number(value);return Number.isFinite(n)&&n>0?n:0};
const decimalParts=(value:number|string)=>{const text=String(value);if(!/^\\d+(?:\\.\\d+)?$/.test(text))return null;const [whole,fraction=""]=text.split(".");return{whole:whole.replace(/^0+(?=\\d)/,""),fraction:fraction.replace(/0+$/,"")}};
const compareReceive=(a:number|string,b:number|string)=>{const x=decimalParts(a),y=decimalParts(b);if(!x&&!y)return 0;if(!x)return-1;if(!y)return 1;if(x.whole.length!==y.whole.length)return x.whole.length>y.whole.length?1:-1;if(x.whole!==y.whole)return x.whole>y.whole?1:-1;const width=Math.max(x.fraction.length,y.fraction.length),xf=x.fraction.padEnd(width,"0"),yf=y.fraction.padEnd(width,"0");return xf===yf?0:xf>yf?1:-1};
const bps=(delta:number,base:number)=>base>0?(delta/base)*10000:0;
export function detectRouteChange(previous:QuoteSnapshot[],next:QuoteSnapshot[],selectedId:string,minImprovementBps=1):RouteChange|null{
 const oldSelected=previous.find(q=>q.id===selectedId);const newSelected=next.find(q=>q.id===selectedId);
 if(!oldSelected||!newSelected)return null;
 const best=[...next].sort((a,b)=>compareReceive(b.receive,a.receive))[0];
 if(best&&best.id!==selectedId){
  const selectedReceive=receiveNumber(newSelected.receive),bestReceive=receiveNumber(best.receive);const delta=bestReceive-selectedReceive;const deltaBps=bps(delta,selectedReceive);
  if(deltaBps>=minImprovementBps)return{kind:"better-route",previous:newSelected,next:best,delta,deltaBps};
 }
 const oldReceive=receiveNumber(oldSelected.receive),newReceive=receiveNumber(newSelected.receive);const delta=newReceive-oldReceive;const exact=exactBps(oldSelected.receive,newSelected.receive);const deltaBps=exact??Math.abs(bps(delta,oldReceive));
 if(deltaBps>=minImprovementBps)return{kind:delta>0?"selected-improved":"selected-worsened",previous:oldSelected,next:newSelected,delta,deltaBps};
 return null;
}