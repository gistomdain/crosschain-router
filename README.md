# Crosschain Router

A responsive, non-custodial route comparison and wallet execution interface. Routes are requested from live providers; the app does not hold funds or wallet keys.

## Current execution paths

- EVM cross-chain quotes from Relay, Across, LI.FI, and deBridge, subject to provider support for the selected pair.
- EVM same-chain swap quotes through LI.FI.
- Solana same-chain SOL/USDC swaps through Jupiter. Solana USDT and EVM-to-Solana execution are not enabled.
- Wallet-side signing, transaction simulation and gas estimation, fresh route comparison before signing, expiry protection, approval recovery, and transaction status display.

A provider can return no route or become unavailable. Quoted cost and arrival time are estimates. A submitted cross-chain transfer may need separate source and destination confirmation; never retry a transfer just because status polling is delayed.

## Run locally

Use Node.js 24 for the included TypeScript test runner.

```bash
cp .env.example .env.local
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Open http://localhost:3000. Provider keys and RPC endpoints are configured server-side in `.env.local`. Keep credentials out of `NEXT_PUBLIC_` variables. A compatible browser wallet is required for execution.
The deBridge public `create-tx` endpoint does not require a key for local testing; this app does not read `DEBRIDGE_API_KEY`. Commercial integrations can request a dedicated key and higher limits from deBridge, but that credential is not wired into this adapter yet.

## Read-only live quote check

With the app running and provider credentials configured, set `ROUTER_TEST_WALLET` to a public EVM address and run `npm run verify:live`. The check requests a Base-to-Arbitrum 100 USDC quote by default, then prepares each returned route. It prints provider health and whether the prepared transaction passes basic shape and expiry checks. It does not connect a wallet, sign, approve, or submit a transaction. You can override `ROUTER_BASE_URL`, `ROUTER_FROM_CHAIN`, `ROUTER_TO_CHAIN`, `ROUTER_FROM_TOKEN`, `ROUTER_TO_TOKEN`, and `ROUTER_AMOUNT`.

A provider may require an account with sufficient balance to return an executable route. A passing quote check does not replace a funded transfer test.

## HTTPS test preview on Vercel

Import `gistomdain/crosschain-router` as a Next.js project in Vercel. The standard `npm run build` command is sufficient. Set provider credentials and RPC URLs in the project environment settings, using the names in `.env.example`; copy values from your local `.env.local` privately. Never commit `.env.local` or put provider secrets under `NEXT_PUBLIC_`. LI.FI and Relay can request quotes without their optional keys, while Across requires `ACROSS_API_KEY` and a four-digit hexadecimal `ACROSS_INTEGRATOR_ID` in this adapter.

Deploy to get an HTTPS URL, then check Base → Arbitrum, 100 USDC in a mobile wallet browser. The preview can display read-only quotes before a wallet connects; connecting a wallet refreshes quotes for that address. Inspect the review screen without signing while validating the deployment. Run funded end-to-end tests and verify provider terms and monitoring before inviting real transfers.

## Production setup

1. Configure reliable RPC endpoints for each enabled EVM chain and Solana. Source receipt tracking is limited when an EVM endpoint is missing.
2. Add provider credentials where required by the provider or status service. Verify each provider account, supported networks, rate limits, and quote/transaction schemas against its current documentation.
3. Configure Jupiter and Solana RPC endpoints for the Solana lane. Test wallet compatibility and confirmation behavior on real wallets.
4. Run `npm test`, `npm run typecheck`, and `npm run build`; then perform wallet-funded, low-value end-to-end tests for every enabled chain/provider pair before public launch.
5. Monitor provider and RPC errors, delayed transfers, failed approvals, and refunds. Confirm explorer and status links for every chain.

This repository has no custodial backend. Approval hashes and submitted transfer receipts are stored locally in the user's browser for recovery; clearing browser storage removes that local history. Approval confirmation never automatically starts a swap. A fresh quote and explicit wallet review are required.

## Known limits

- Provider availability and destination tracking depend on external APIs and configured credentials.
- There is no automated funded mainnet transaction test in this repository. The included tests cover route deterioration, expiry, and changed transaction detection.
- Transactions already broadcast cannot be cancelled by this interface. A wallet or RPC timeout does not prove that a transaction failed; check its hash and chain status before trying again.
