"use client";

import {useState} from "react";
import {Shield,Wallet} from "lucide-react";

export function WalletMark({name,icon,className=""}:{name:string;icon?:string;className?:string}){
 const [broken,setBroken]=useState(false);
 const safe=typeof icon==="string"&&icon.length<20000&&(/^(?:data:image\/(?:png|webp|jpeg|svg\+xml);base64,[A-Za-z0-9+/]+=*|https:\/\/[^\s]+)$/.test(icon));
 if(safe&&!broken)return <img className={`walletMark ${className}`} src={icon} alt="" onError={()=>setBroken(true)}/>;
 const label=name.toLowerCase();
 const mark=label.includes("metamask")?"🦊":label.includes("phantom")?"👻":label.includes("rabby")?"🐰":label.includes("coinbase")?"◉":label.includes("trust")?<Shield size={21}/>:label.includes("solflare")?"✺":label.includes("brave")?"◆":<Wallet size={20}/>;
 return <span className={`walletMark walletMarkFallback ${label.includes("metamask")?"metamask":label.includes("phantom")?"phantom":label.includes("coinbase")?"coinbase":""} ${className}`} aria-hidden="true">{mark}</span>;
}
