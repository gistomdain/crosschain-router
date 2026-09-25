export type QuoteSnapshot={id:string;provider:string;receive:number|string;fee?:number;capturedAt:number};
export type RouteChange={kind:"better-route"|"selected-improved"|"selected-worsened";previous:QuoteSnapshot;next:QuoteSnapshot;delta:number;deltaBps:number};
const receiveNumber=(value:number|string)=>{const n=Number(value);return Number.isFinite(n)&&n>0?n:0};
const bps=(delta:number,base:number)=>base>0?(delta/base)*10000:0;
export function detectRouteChange(previous:QuoteSnapshot[],next:QuoteSnapshot[],selectedId:string,minImprovementBps=1):RouteChange|null{
 const oldSelected=previous.find(q=>q.id===selectedId);const newSelected=next.find(q=>q.id===selectedId);
 if(!oldSelected||!newSelected)return null;
 const best=[...next].sort((a,b)=>receiveNumber(b.receive)-receiveNumber(a.receive))[0];
 if(best&&best.id!==selectedId){
  const selectedReceive=receiveNumber(newSelected.receive),bestReceive=receiveNumber(best.receive);const delta=bestReceive-selectedReceive;const deltaBps=bps(delta,selectedReceive);
  if(deltaBps>=minImprovementBps)return{kind:"better-route",previous:newSelected,next:best,delta,deltaBps};
 }
 const oldReceive=receiveNumber(oldSelected.receive),newReceive=receiveNumber(newSelected.receive);const delta=newReceive-oldReceive;const deltaBps=Math.abs(bps(delta,oldReceive));
 if(deltaBps>=minImprovementBps)return{kind:delta>0?"selected-improved":"selected-worsened",previous:oldSelected,next:newSelected,delta,deltaBps};
 return null;
}