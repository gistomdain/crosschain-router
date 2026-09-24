export type QuoteSnapshot={id:string;provider:string;receive:number;fee?:number;capturedAt:number};
export type RouteChange={kind:"better-route"|"selected-improved"|"selected-worsened";previous:QuoteSnapshot;next:QuoteSnapshot;delta:number;deltaBps:number};
const bps=(delta:number,base:number)=>base>0?(delta/base)*10000:0;
export function detectRouteChange(previous:QuoteSnapshot[],next:QuoteSnapshot[],selectedId:string,minImprovementBps=1):RouteChange|null{
 const oldSelected=previous.find(q=>q.id===selectedId);const newSelected=next.find(q=>q.id===selectedId);
 if(!oldSelected||!newSelected)return null;
 const best=[...next].sort((a,b)=>b.receive-a.receive)[0];
 if(best&&best.id!==selectedId){
  const delta=best.receive-newSelected.receive;const deltaBps=bps(delta,newSelected.receive);
  if(deltaBps>=minImprovementBps)return{kind:"better-route",previous:newSelected,next:best,delta,deltaBps};
 }
 const delta=newSelected.receive-oldSelected.receive;const deltaBps=Math.abs(bps(delta,oldSelected.receive));
 if(deltaBps>=minImprovementBps)return{kind:delta>0?"selected-improved":"selected-worsened",previous:oldSelected,next:newSelected,delta,deltaBps};
 return null;
}