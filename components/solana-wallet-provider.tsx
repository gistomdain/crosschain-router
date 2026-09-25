"use client";
import {createContext,useContext,useState} from "react";
import {createClient} from "@solana/kit";
import {solanaRpc} from "@solana/kit-plugin-rpc";
import {walletSigner} from "@solana/kit-plugin-wallet";
import {ClientProvider,useWalletAccountTransactionSendingSigner} from "@solana/react";
import {useConnect,useConnectedWallet,useDisconnect,useIsWalletReady,useWallets} from "@solana/kit-plugin-wallet/react";

const rpcUrl=process.env.NEXT_PUBLIC_SOLANA_RPC_URL??"https://api.mainnet-beta.solana.com";
export const solanaClient=createClient().use(walletSigner({chain:"solana:mainnet"})).use(solanaRpc({rpcUrl}));
export type SolanaClient=Awaited<typeof solanaClient>;
type State={address?:string;connected:boolean;connecting:boolean;error?:string;connect:()=>Promise<void>;disconnect:()=>Promise<void>;signer?:unknown};
const Context=createContext<State|null>(null);

function WalletBridge({children}:{children:React.ReactNode}){
 const wallets=useWallets(solanaClient);const connected=useConnectedWallet(solanaClient);const ready=useIsWalletReady(solanaClient);const connectAction=useConnect(solanaClient);const disconnectAction=useDisconnect(solanaClient);const [error,setError]=useState<string>();
 const connection=connected as {account?:{address?:string;chains?:readonly string[]}}|null;
 const account=connection?.account;
 const signer=account?useWalletAccountTransactionSendingSigner(account as never,"solana:mainnet"):undefined;
 const connect=async()=>{setError(undefined);if(!ready){setError("Solana wallet discovery is still starting");return}const wallet=wallets[0];if(!wallet){setError("No Wallet Standard compatible Solana wallet detected");return}try{await connectAction.dispatch(wallet)}catch(e){setError(e instanceof Error?e.message:"Solana wallet connection failed")}};
 const disconnect=async()=>{setError(undefined);try{await disconnectAction.dispatch()}catch(e){setError(e instanceof Error?e.message:"Solana wallet disconnect failed")}};
 const address=connection?.account?.address;
 return <Context.Provider value={{address,connected:!!address,connecting:false,error,connect,disconnect,signer}}>{children}</Context.Provider>
}
export function SolanaWalletProvider({children}:{children:React.ReactNode}){return <ClientProvider client={solanaClient}><WalletBridge>{children}</WalletBridge></ClientProvider>}
export function useSolanaWallet(){const v=useContext(Context);if(!v)throw new Error("useSolanaWallet must be used inside SolanaWalletProvider");return v}
export function shortSolanaAddress(a?:string){return a?a.slice(0,4)+"…"+a.slice(-4):""}
