# Reach

## Who it is for

- **Property / air-rights owners** in dense cities (demo: Mumbai BKC / Jio World Centre) who want to mint a title and list a time-bound view or envelope lease.
- **Buyers / developers / advertisers** who want a Lease NFT proving use rights for a term without buying land.
- **ETHGlobal judges** verifying Hedera settlement + Arkiv expiry in one loop.

## Can they try it today?

Yes, on Hedera Testnet (296) + Arkiv Rabdi:

1. `npm install && cp .env.example .env` (fill keys)
2. `npm run dev` → http://localhost:3000
3. Flow: `/tokenize` → `/lease/create` → `/listings`

Public explorer for indexed leases: https://rabdi.explorer.arkiv.network

## After Mumbai

We intend to keep the Rabdi index schema (`airspace.mumbai.leases`) and expand cities / parcel presets. Settlement stays on Hedera; Arkiv remains the expiring marketplace index so dead offers do not need a cleanup cron.
