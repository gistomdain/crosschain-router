"use client";
import {useEffect,useRef,useState} from "react";
import {detectRouteChange,type QuoteSnapshot,type RouteChange} from "@/lib/router/route-change";
export function useRouteChangeAlert(quotes:QuoteSnapshot[],selectedId:string){const previous=useRef<QuoteSnapshot[]>(quotes);const [change,setChange]=useState<RouteChange|null>(null);const [lastChecked,setLastChecked]=useState(Date.now());
 useEffect(()=>{const found=detectRouteChange(previous.current,quotes,selectedId);if(found)setChange(found);previous.current=quotes;setLastChecked(Date.now())},[quotes,selectedId]);
 const accept=()=>{const id=change?.next.id;setChange(null);return id};const dismiss=()=>setChange(null);return{change,lastChecked,accept,dismiss}}
