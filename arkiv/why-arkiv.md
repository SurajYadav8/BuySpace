# Why Arkiv

## If we swapped Arkiv for Postgres, users would lose

- **Trustless discovery.** Anyone can query open leases on Rabdi without trusting our API or database.
- **Wallet-owned entities.** The indexer wallet owns the entity; attributes encode the Hedera title owner and lessee.
- **Automatic expiry.** Lease offers disappear from queries when the term ends. No admin job to unpublish stale listings.
- **Shared explorer.** Judges and third parties can open entity / tx links on https://rabdi.explorer.arkiv.network independently of BuySpace.

## What we kept off Arkiv (and why)

| Data | Where it lives | Why |
| --- | --- | --- |
| Title mint / listing / purchase settlement | Hedera (EVM contracts + HTS Lease NFT) | Money movement and NFT custody belong on Hedera |
| Private keys / operator secrets | `.env` (never committed) | Security |
| Local demo cache | `data/airspace-store.json` (gitignored) | Offline fallback only when Rabdi is unreachable |
| Map tiles / UX | Mapbox + Next.js | Not marketplace state |

Arkiv is the **public, expiring lease index**. Hedera is the **settlement and title rail**.
