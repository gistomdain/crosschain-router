# Crosschain Router

A responsive cross-chain route comparison and execution interface.

## Build 02
- Responsive swap/bridge interface and Route Intelligence panel
- Demo normalized quotes for Relay, Across, LI.FI and deBridge
- Quote API scaffold at `/api/quote`
- Chain registry: Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, Solana
- Token registry: USDC, USDT, ETH, SOL, WBTC
- Provider adapter interface for LI.FI, Relay, Across and deBridge
- Parallel provider orchestration foundation
- Route ranking: best return, fastest and lowest fee
- Quote-expiry / stale-quote utility
- Health endpoint at `/api/health`
- Security rules for non-custodial execution
- Environment template for server-side provider credentials

> Current UI quote values remain illustrative. Provider adapter files intentionally return no executable transaction until canonical token addresses, provider-specific request validation and live credentials are configured.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Then open http://localhost:3000.

## Architecture

```
UI
  -> Quote API
     -> Provider adapters
        -> LI.FI
        -> Relay
        -> Across
        -> deBridge
     -> Normalize
     -> Rank
     -> Re-quote protection
  -> Wallet-side execution
  -> Transaction tracker
```

## Next milestones

1. Canonical token-address registry per chain.
2. Wire live provider request/response mappings.
3. Add wagmi/viem EVM wallet connectivity.
4. Add Solana wallet adapter.
5. Implement chain/token selector modals.
6. Quote expiry countdown and automatic re-quote.
7. Transaction simulation, execution and status tracking.
8. Destination actions and transaction recovery.

## Security

The application must never request or store seed phrases or private keys. Execution should be performed through user wallet signatures, with transaction targets and quote freshness validated immediately before signing.
