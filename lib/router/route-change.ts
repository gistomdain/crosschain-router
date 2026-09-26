export type QuoteSnapshot={id:string;provider:string;receive:number|string;fee?:number;capturedAt:number};
export type RouteChange={kind:"better-route"|"selected-improved"|"selected-worsened";previous:QuoteSnapshot;next:QuoteSnapshot;deltaText:string;deltaBps:number};
const scaled=(value:number|string)=>{const text=String(value);if(!/^\d+(?:\.\d+)?$/.test(text))return null;const [whole,fraction=""]=text.split(".");try{return{whole:BigInt(whole),fraction,scale:10n**BigInt(fraction.length)}}catch{return null}};
const exactBps=(a:number|string,b:number|string)=>{const x=scaled(a),y=scaled(b);if(!x||!y)return null;const scale=x.scale>y.scale?x.scale:y.scale;const xv=x.whole*scale+BigInt(x.fraction||"0")*(scale/x.scale);const yv=y.whole*scale+BigInt(y.fraction||"0")*(scale/y.scale);if(xv<=0n)return null;const delta=yv>=xv?yv-xv:xv-yv;return Number(delta*10000n/xv)};
const differenceText=(a:number|string,b:number|string,places=4)=>{const x=scaled(a),y=scaled(b);if(!x||!y)return "0";const scale=x.scale>y.scale?x.scale:y.scale,xv=x.whole*scale+BigInt(x.fraction||"0")*(scale/x.scale),yv=y.whole*scale+BigInt(y.fraction||"0")*(scale/y.scale),d=xv>=yv?xv-yv:yv-xv,whole=d/scale,fraction=(d%scale).toString().padStart(scale.toString().length-1,"0").slice(0,places).replace(/0+$/,"");return fraction?whole+"."+fraction:whole.toString()};
const decimalParts=(value:number|string)=>{const text=String(value);if(!/^\d+(?:\.\d+)?$/.test(text))return null;const [whole,fraction=""]=text.split(".");return{whole:whole.replace(/^0+(?=\d)/,""),fraction:fraction.replace(/0+$/,"")}};
const compareReceive=(a:number|string,b:number|string)=>{const x=decimalParts(a),y=decimalParts(b);if(!x&&!y)return 0;if(!x)return-1;if(!y)return 1;if(x.whole.length!==y.whole.length)return x.whole.length>y.whole.length?1:-1;if(x.whole!==y.whole)return x.whole>y.whole?1:-1;const width=Math.max(x.fraction.length,y.fraction.length),xf=x.fraction.padEnd(width,"0"),yf=y.fraction.padEnd(width,"0");return xf===yf?0:xf>yf?1:-1};
export function detectRouteChange(previous:QuoteSnapshot[],next:QuoteSnapshot[],selectedId:string,minImprovementBps=1):RouteChange|null{
 const oldSelected=previous.find(q=>q.id===selectedId);const newSelected=next.find(q=>q.id===selectedId);
 if(!oldSelected||!newSelected)return null;
 const best=[...next].sort((a,b)=>compareReceive(b.receive,a.receive))[0];
 if(best&&best.id!==selectedId){
  const deltaBps=exactBps(newSelected.receive,best.receive);if(deltaBps===null)return null;
  if(deltaBps>=minImprovementBps)return{kind:"better-route",previous:newSelected,next:best,deltaText:differenceText(best.receive,newSelected.receive),deltaBps};
 }
 const deltaBps=exactBps(oldSelected.receive,newSelected.receive);if(deltaBps===null)return null;
 const direction=compareReceive(newSelected.receive,oldSelected.receive);if(deltaBps>=minImprovementBps&&direction!==0)return{kind:direction>0?"selected-improved":"selected-worsened",previous:oldSelected,next:newSelected,deltaText:differenceText(newSelected.receive,oldSelected.receive),deltaBps};
 return null;
}