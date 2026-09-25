export function assertWalletContext(chain:unknown,accounts:unknown,expectedChainId:number,expectedAddress:string,transactionChainId?:number){
 if(!Number.isSafeInteger(expectedChainId)||Number(chain)!==expectedChainId||transactionChainId!==undefined&&transactionChainId!==expectedChainId)throw new Error("Wallet network changed. Switch to the source chain and review again.");
 if(!Array.isArray(accounts)||typeof accounts[0]!=="string"||accounts[0].toLowerCase()!==expectedAddress.toLowerCase())throw new Error("Wallet account changed. Review the route again.");
}
