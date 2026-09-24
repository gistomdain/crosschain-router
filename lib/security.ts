export const EXECUTION_RULES=[
"Never request or store seed phrases or private keys.",
"Require wallet-side signing for every user-authorized transaction.",
"Re-quote before signing when a quote expires or materially changes.",
"Show minimum received and all known fees before execution.",
"Validate destination chain, token and transaction target before wallet submission."
] as const;