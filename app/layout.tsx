import type { Metadata } from "next";
import "./globals.css";
import {WalletProvider} from "@/components/wallet-provider";
export const metadata:Metadata={title:"Crosschain Router",description:"Compare cross-chain routes before you sign."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><WalletProvider>{children}</WalletProvider></body></html>}