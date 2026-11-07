# BuySpace

**ETHGlobal Mumbai 2026** — tokenize urban **air rights** (not land) on **Hedera Testnet**, and index time-bound lease offers on **Arkiv Rabdi** so they expire with the commercial term.

| Partner | Role in BuySpace |
| --- | --- |
| **Hedera** (chain id `296`) | Title NFT mint, on-chain lease listing, HBAR purchase, Lease NFT to buyer |
| **Arkiv** (Rabdi, chain id `7794095`) | Public, queryable lease entities with wallet ownership + automatic expiry |

> A lease is a **time-bound use right**. The Title NFT stays with the owner. Buyers receive a Lease NFT for the term only.

---

## Table of contents

- [Problem](#problem)
- [Demo flow](#demo-flow)
- [Architecture](#architecture)
- [Hedera integration](#hedera-integration)
- [Arkiv integration](#arkiv-integration)
- [Hackathon prize mapping](#hackathon-prize-mapping)
- [Setup](#setup)
- [Env](#env)
- [Deploy contracts](#deploy-contracts)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [AI usage](#ai-usage)
- [License](#license)

---

## Problem

Urban airspace above parcels (views, envelopes, advertising planes) is valuable, but hard to package as a clean digital right. BuySpace:

1. Mints a **Title NFT** for the vertical envelope on Hedera.
2. Lets the owner **list a lease** priced in HBAR with a fixed term.
3. Indexes that offer on **Arkiv** with an expiry matching the term.
4. Lets a buyer **pay from their own wallet**, receive a **Lease NFT**, while title remains with the owner.
5. When the term ends, the Arkiv entity expires and the marketplace listing disappears without a cleanup cron.

---

## Demo flow

| Step | Route | What happens |
| --- | --- | --- |
| 1 | `/` | Product home + Mumbai map corridor |
| 2 | `/tokenize` | Owner wallet mints Title NFT on Hedera |
| 3 | `/lease/create` | Owner creates on-chain listing + Arkiv entity (`status=open`) |
| 4 | `/listings` | Buyer pays HBAR; Lease NFT minted; Arkiv patched to `leased` |
| 5 | `/dashboard` | Status, HashScan + Arkiv explorer links |
| 6 | `/my-nfts` | Title and lease positions |

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 14 (App Router)                  │
│  UI: tokenize · create lease · marketplace · dashboard      │
│  Wallet: RainbowKit + wagmi (Hedera Testnet 296)            │
└───────────────┬───────────────────────────────┬─────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────┐     ┌─────────────────────────────┐
│  Hedera Testnet (296)     │     │  Arkiv Rabdi (7794095)      │
│  • AirspaceTitle (EVM)    │     │  • schema airspace.mumbai   │
│  • AirspaceLeaseMarket    │     │    .leases                  │
│  • HBAR settlement        │     │  • create / patch / expire  │
│  • HTS Lease NFT (SDK)    │     │  • marketplace queries      │
│  • Optional ATS equity    │     │  • Explorer links           │
└───────────────────────────┘     └─────────────────────────────┘
                │                               │
                └───────────────┬───────────────┘
                                ▼
                    HashScan + Rabdi explorers
```

**Settlement vs index**

- **Hedera** = money + NFT custody (source of truth for ownership and payment).
- **Arkiv** = public discovery index with built-in expiry (source of truth for “is this offer still on the market?”).

Local `data/airspace-store.json` is an offline cache only (gitignored). Marketplace prefers Arkiv.

---

## Hedera integration

### Networks and explorers

- Network: **Hedera Testnet** (EVM chain id **296**)
- RPC (preferred): `https://296.rpc.thirdweb.com` (Hashio can flake)
- Explorer: https://hashscan.io/testnet

### Deployed demo contracts (testnet)

| Contract | Address | HashScan |
| --- | --- | --- |
| `AirspaceTitle` | `0xc1376eB2C40Bbed71cC4DE2861d3EA1b380Dd160` | [contract](https://hashscan.io/testnet/contract/0xc1376eB2C40Bbed71cC4DE2861d3EA1b380Dd160) |
| `AirspaceLeaseMarket` | `0x1BbA01B86461594211957688F1150a1912478f29` | [contract](https://hashscan.io/testnet/contract/0x1BbA01B86461594211957688F1150a1912478f29) |

Sources: `src/contracts/AirspaceTitle.sol`, `src/contracts/AirspaceLeaseMarket.sol`  
ABIs: `src/abis/`

### Payment / lease flow (Hedera)

1. **Mint title** — owner wallet calls `AirspaceTitle` (`src/services/hedera/walletAirspaceService.ts`).
2. **Create listing** — owner calls `AirspaceLeaseMarket.createListing` with price in tinybars / wei mapping used by the demo.
3. **Purchase** — buyer wallet pays HBAR on the market contract; app mints/transfers a **Lease NFT** via Hedera Token Service (`src/services/hedera/leaseNftService.ts` + `@hashgraph/sdk`).
4. **Optional ATS path** — Asset Tokenization Studio equity issue for parcel title (`src/services/hedera/atsAirspaceService.ts`) for the Hedera Studios / RWA narrative.

### Operator note

Contract **deploy** scripts use `HEDERA_PRIVATE_KEY` from `.env` (never committed). End-user mint / list / buy in the demo is intended to be **wallet-signed** by the connected MetaMask / RainbowKit account on chain 296.

---

## Arkiv integration

### Network

| | |
| --- | --- |
| Chain | Rabdi testnet |
| Chain id | `7794095` |
| RPC | https://rpc.rabdi.db-chain.testnet.arkiv.network |
| Explorer | https://rabdi.explorer.arkiv.network |
| Faucet | https://hub.arkiv.network/faucet |
| Access keys | https://hub.arkiv.network/access-keys |
| SDK | `@arkiv-network/sdk` |

### Writer wallet (entities created by BuySpace)

```text
0x44ceC583971bEDb52934652F406A152f3C8aFb13
```

### Schema

`airspace.mumbai.leases` — full field list, ownership, and expiry rules in **[`arkiv/schema.md`](./arkiv/schema.md)**.

### One query you can run

Open offers (same filter the marketplace uses):

```text
arkiv.schema = str('airspace.mumbai.leases') AND status = str('open')
```

Example JSON-RPC body (replace `ACCESS_KEY`):

```bash
curl -s https://rpc.rabdi.db-chain.testnet.arkiv.network/ACCESS_KEY \
  -H 'content-type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"arkiv_query",
    "params":[
      "arkiv.schema = str('\''airspace.mumbai.leases'\'') AND status = str('\''open'\'')",
      {"select":{"key":true,"attributes":{"status":true,"title":true,"price":true,"city":true}}}
    ]
  }'
```

In-app: `GET /api/arkiv/leases` → `/listings`.

### Prize docs (Arkiv “Build on Arkiv”)

| File | Purpose |
| --- | --- |
| [`arkiv/schema.md`](./arkiv/schema.md) | Entities, fields, owners, expiry |
| [`arkiv/friction.md`](./arkiv/friction.md) | Feedback / what broke |
| [`arkiv/reach.md`](./arkiv/reach.md) | Audience and try-it-today |
| [`arkiv/why-arkiv.md`](./arkiv/why-arkiv.md) | Why not Postgres |
| [`arkiv/how-you-use-arkiv.md`](./arkiv/how-you-use-arkiv.md) | Filters, edit rights, UX impact |

---

## Hackathon prize mapping

### Arkiv — Build on Arkiv (from scratch)

BuySpace is a **market of expiring lease offers**: entities are created on list, queried on marketplace, patched on buy, and expire with the term. Qualification artifacts are under `/arkiv/*` and this README lists the writer address + runnable query.

### Hedera — Tokenize Anything with Hedera Studios / general Hedera build

- RWA-style **air-rights title** path (EVM Title NFT + optional **ATS** equity helpers).
- End-to-end **HBAR payment** on testnet via `AirspaceLeaseMarket`.
- **HTS Lease NFT** certificate to the buyer.
- README covers setup, architecture, and payment flow; contracts linked on HashScan above.

> If you record a demo video (≤ 5 min), show: mint title → list → buy with HBAR → HashScan tx + Arkiv entity that will expire.

---

## Setup

```bash
git clone https://github.com/SurajYadav8/BuySpace.git
cd BuySpace
cp .env.example .env
# fill Hedera + Arkiv + Mapbox + WalletConnect values
npm install
npm run dev
```

Open http://localhost:3000

---

## Env

Copy [`.env.example`](./.env.example). **Never commit `.env`.**

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_AIRSPACE_TITLE_ADDRESS` | mint / demo | Title contract |
| `NEXT_PUBLIC_AIRSPACE_MARKET_ADDRESS` | list / buy | Market contract |
| `NEXT_PUBLIC_HEDERA_RPC_URL` | wallet txs | Prefer thirdweb `296` RPC |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | RainbowKit | WalletConnect Cloud |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | home map | Mapbox token |
| `ARKIV_ACCESS_KEY` | index R/W | https://hub.arkiv.network/access-keys |
| `ARKIV_PRIVATE_KEY` | index writes | Fund with tGLM faucet |
| `HEDERA_ACCOUNT_ID` / `HEDERA_PRIVATE_KEY` / `HEDERA_EVM_ADDRESS` | deploy / ATS / lease NFT operator | Server-side only |

---

## Deploy contracts

```bash
# Title + market
npm run deploy:hedera

# Market only (after title exists)
npm run deploy:market
```

Scripts write `NEXT_PUBLIC_AIRSPACE_*` back into `.env`.

---

## Project structure

```text
BuySpace/
├── arkiv/                    # Hackathon Arkiv docs (schema, friction, …)
├── scripts/                  # Hedera contract deploy
├── src/
│   ├── abis/                 # Title + market ABIs
│   ├── app/                  # Next.js routes + API
│   │   ├── api/arkiv/        # leases, purchase, end-lease
│   │   ├── api/hedera/       # tokenize, titles, status
│   │   ├── tokenize/
│   │   ├── lease/create/
│   │   ├── listings/
│   │   └── dashboard/
│   ├── components/
│   ├── config/               # chains, contracts, wagmi, mumbai presets
│   ├── contracts/            # Solidity sources
│   └── services/
│       ├── arkiv/            # schema + lease index service
│       ├── hedera/           # wallet mint/list/buy, HTS, ATS
│       └── marketplaceService.ts
├── .env.example
├── PRODUCT.md
├── DESIGN.md
└── LICENSE
```

---

## Tech stack

- **App:** Next.js 14, TypeScript, Tailwind, Framer Motion  
- **Wallet:** RainbowKit, wagmi, viem, ethers  
- **Hedera:** `@hashgraph/sdk`, optional `@hashgraph/asset-tokenization-sdk`, EVM contracts on 296  
- **Arkiv:** `@arkiv-network/sdk` on Rabdi  
- **Map:** Mapbox GL  

---

## AI usage

Built with AI-assisted coding (Cursor) for UI layout, Arkiv/Hedera wiring, and docs. Product decisions, contract design, demo corridor (BKC / Jio World Centre), and prize-track mapping were directed by the team. Per ETHGlobal rules: AI was a tool, not a substitute for ownership of the submission.

---

## License

[MIT](./LICENSE)

---

## Links

- Repo: https://github.com/SurajYadav8/BuySpace  
- Hedera docs: https://docs.hedera.com  
- Arkiv docs: https://docs.arkiv.network  
- Arkiv explorer: https://rabdi.explorer.arkiv.network  
- HashScan testnet: https://hashscan.io/testnet  
