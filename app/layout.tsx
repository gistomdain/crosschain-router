import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"Crosschain Router",description:"Compare cross-chain routes before you sign."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}