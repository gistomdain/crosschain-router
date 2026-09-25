"use client";
import {useEffect,useRef,useState} from "react";
import {detectRouteChange,type QuoteSnapshot,type RouteChange} from "@/lib/router/route-change";
export function useRouteChangeAlert(quotes:QuoteSnapshot[],selectedId:string,contextKey=""){const previous=useRef<QuoteSnapshot[]>(quotes);const previousContext=useRef(contextKey);const [change,setChange]=useState<RouteChange|null>(null);const [lastChecked,setLastChecked]=useState(Date.now());
 useEffect(()=>{if(previousContext.current!==contextKey){previousContext.current=contextKey;previous.current=quotes;setChange(null);setLastChecked(Date.now());return}const found=detectRouteChange(previous.current,quotes,selectedId);if(found)setChange(found);previous.current=quotes;setLastChecked(Date.now())},[quotes,selectedId,contextKey]);
 const accept=()=>{const id=change?.next.id;setChange(null);return id};const dismiss=()=>setChange(null);return{change,lastChecked,accept,dismiss}}
