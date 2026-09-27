"use client";
import {useEffect,useState} from "react";
import {displayTokenSymbol} from "@/lib/tokens";
import {BrandLogo} from "@/components/brand-logo";

export function TokenIcon({name,address,logoURI,className=""}:{name:string;address?:string;logoURI?:string;className?:string}){
 const [broken,setBroken]=useState(false);
 useEffect(()=>setBroken(false),[logoURI]);
 if(logoURI&&!broken)return <img className={className} src={logoURI} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setBroken(true)}/>;
 if(!address)return <BrandLogo kind="token" name={name} className={className}/>;
 return <span className={`${className} tokenIconFallback`} aria-hidden="true">{displayTokenSymbol(name).slice(0,1).toUpperCase()}</span>;
}
