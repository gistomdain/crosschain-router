import type {UiQuote,ProviderHealth} from "@/hooks/use-quotes";
export type ConfidenceSignal={key:"freshness"|"provider"|"execution"|"complexity";label:string;state:"good"|"caution"|"unknown";detail:string};
export function routeConfidence(route:UiQuote,health:ProviderHealth[]|undefined,now=Date.now()):ConfidenceSignal[]{const provider=health?.find(h=>h.provider===route.provider);const expires=route.expiresAt?new Date(route.expiresAt).getTime():0;const remaining=expires?Math.max(0,Math.ceil((expires-now)/1000)):0;const approvals=route.approvalTxs?.length??0;return[
{key:"freshness",label:"Quote freshness",state:!expires?"unknown":remaining>8?"good":"caution",detail:!expires?"Expiry not supplied":remaining+"s remaining"},
{key:"provider",label:"Provider response",state:!provider?"unknown":provider.status==="healthy"?"good":provider.status==="slow"?"caution":"unknown",detail:!provider?"No telemetry":provider.status==="unavailable"?"Unavailable":provider.latencyMs+"ms · "+provider.status},
{key:"execution",label:"Executable data",state:route.tx?"good":"caution",detail:route.tx?"Transaction supplied":"Quote only"},
{key:"complexity",label:"Wallet steps",state:approvals<=1?"good":"caution",detail:approvals?approvals+" approval"+(approvals===1?"":"s")+" + execution":"Single execution"}
]}