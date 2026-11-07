# BuySpace

Marketplace to tokenize and lease urban airspace rights (not land) on Hedera Testnet, with Arkiv Rabdi indexing time-bound lease offers.

## Audience

ETHGlobal demo judges, owners listing air rights, buyers leasing view or envelope rights.

## Core loop

1. Owner connects wallet on Hedera Testnet (296).
2. Owner mints a Title NFT for a parcel.
3. Owner lists a lease (price in HBAR, term in days).
4. BuySpace indexes the offer on Arkiv with expiry.
5. Buyer pays HBAR, receives a Lease NFT. Title stays with the owner.

## Non-goals

- Not a land title registry
- Not mainnet production custody
- Not multi-chain settlement in the demo

## Integrations

- Hedera: settlement, NFTs, HBAR
- Arkiv: expiring lease index + explorer links
