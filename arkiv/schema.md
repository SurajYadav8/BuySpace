# Arkiv schema

## Entity

| Field | Value |
| --- | --- |
| Schema | `airspace.mumbai.leases` |
| Defined in | `src/services/arkiv/leaseSchema.ts` |
| Network | Arkiv Rabdi testnet (chain id `7794095`) |
| RPC | `https://rpc.rabdi.db-chain.testnet.arkiv.network` |
| Explorer | https://rabdi.explorer.arkiv.network |

## Ownership and expiry

- **Writer / owner wallet (indexer):** `0x44ceC583971bEDb52934652F406A152f3C8aFb13`
- **Semantic owner (attribute):** `owner` = the Hedera EVM address of the parcel title holder
- **Lessee (attribute):** `lessee` set when a buyer completes purchase
- **Expiration:** set at create time to the lease term (capped at 180 days on Arkiv). When the lease activates, expiry is extended to the exact lease end ISO. After expiry, Arkiv drops the entity from queries so the marketplace cleans itself.

## Attributes (indexed where noted)

| Attribute | Type | Indexed | Purpose |
| --- | --- | --- | --- |
| `owner` | addr | yes | Title holder EVM address |
| `lessee` | addr (optional) | yes | Buyer after purchase |
| `status` | str | yes | `open` \| `leased` \| `cancelled` |
| `propertyId` | str | yes | Parcel id |
| `titleTokenId` | str | yes | Hedera Title NFT id |
| `leaseNftSerial` | str (optional) | yes | Lease NFT serial after purchase |
| `price` | dec | yes | Display / listing price |
| `city` | str | yes | e.g. Mumbai |
| `leaseDays` | i32 | yes | Term length |
| `title` | str | no | Listing title |
| `propertyAddress` | str | no | Human address |
| `leaseStartIso` / `leaseEndIso` | str (optional) | no | Active term bounds |
| `currentHeight` / `maximumHeight` / `availableFloors` | i32 | no | Vertical envelope |

## Queries the product uses

Marketplace open offers (also what `/listings` reads via `/api/arkiv/leases`):

```text
arkiv.schema = str('airspace.mumbai.leases') AND status = str('open')
```

Leases for a title holder:

```text
arkiv.schema = str('airspace.mumbai.leases') AND owner = addr('0x…')
```

## Lifecycle

1. **Create listing** (`createLeaseOffer`) → `status = open`, expiry = term days
2. **Purchase** (`activateLeaseOnArkiv`) → `status = leased`, set `lessee` + dates, extend expiry to lease end
3. **After expiry** → entity no longer returned by queries (marketplace listing disappears)
