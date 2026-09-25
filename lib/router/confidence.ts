import type {UiQuote,ProviderHealth} from "@/hooks/use-quotes";
export type ConfidenceSignal={key:"freshness"|"provider"|"execution"|"complexity"|"route-shape";label:string;state:"good"|"caution"|"unknown";detail:string};
export function routeConfidence(route:UiQuote,health:ProviderHealth[]|undefined,now=Date.now()):ConfidenceSignal[]{const provider=health?.find(h=>h.provider===route.provider);const expires=route.expiresAt?new Date(route.expiresAt).getTime():0;const remaining=expires?Math.max(0,Math.ceil((expires-now)/1000)):0;const approvals=route.approvalTxs?.length??0;return[
{key:"freshness",label:"Quote freshness",state:!expires?"unknown":remaining>8?"good":"caution",detail:!expires?"Expiry not supplied":remaining+"s remaining"},
{key:"provider",label:"Provider response",state:!provider?"unknown":provider.status==="healthy"?"good":provider.status==="slow"?"caution":"unknown",detail:!provider?"No telemetry":provider.status==="unavailable"?"Unavailable":provider.latencyMs+"ms · "+provider.status},
{key:"execution",label:"Executable data",state:route.tx?"good":"caution",detail:route.tx?"Transaction supplied":"Quote only"},
{key:"route-shape",label:"Execution path",state:route.routeMeta?.execution?"good":"unknown",detail:route.routeMeta?.execution?describeExecution(route.routeMeta.execution,route.routeMeta.hopCount):"Provider path metadata unavailable"},
{key:"complexity",label:"Wallet steps",state:approvals<=1?"good":"caution",detail:approvals?approvals+" approval"+(approvals===1?"":"s")+" + execution":"Single execution"}
]}
function describeExecution(execution:NonNullable<UiQuote["routeMeta"]>["execution"],hops?:number){const label=execution==="swap"?"DEX swap":execution==="bridge"?"Direct bridge":execution==="swap-bridge"?"Swap + bridge":execution==="solver"?"Solver execution":"Multi-hop";return hops&&hops>1?`${label} · ${hops} hops`:label}
