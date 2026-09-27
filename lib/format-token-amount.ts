export function formatTokenAmount(value:number|string,digits=4){
 const s=String(value),[whole,fraction=""]=s.split(".");
 const grouped=whole.replace(/\B(?=(\d{3})+(?!\d))/g,",");
 const firstNonzero=fraction.search(/[1-9]/);
 const decimals=whole.replace(/^0+/,"")===""&&firstNonzero>=digits?firstNonzero+4:digits;
 const trimmed=fraction.slice(0,decimals).replace(/0+$/,"");
 return trimmed?`${grouped}.${trimmed}`:grouped;
}
