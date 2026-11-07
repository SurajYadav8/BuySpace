# How we use Arkiv

## Filters match the product

| User-visible action | Arkiv feature |
| --- | --- |
| Marketplace shows open leases | Query `status = open` on schema `airspace.mumbai.leases` |
| Owner lists a lease | `createEntity` with attributes + `ExpirationTime.fromDays(leaseDays)` |
| Buyer purchases | `patchEntity` → `status=leased`, set `lessee`, NFT serial, dates; `extendEntity` to lease end |
| Term ends | Entity expires → drops out of queries → listing gone from UI |

## Who can edit

- Entities are written/patched by the BuySpace indexer wallet (`0x44ceC583971bEDb52934652F406A152f3C8aFb13`).
- Hedera title owner and lessee are recorded as attributes so the marketplace can display rightful parties without giving every user write access to the index.

## Expiry fits the commercial term

Offer expiry is bound to `leaseDays` (max 180 on Arkiv). After purchase, expiry tracks `leaseEndIso`. That is the product promise: **time-bound air rights that do not linger on the market**.

## Code paths

- Write / patch: `src/services/arkiv/arkivLeaseService.ts`
- Schema: `src/services/arkiv/leaseSchema.ts`
- User-facing read: `GET /api/arkiv/leases` → `/listings`, `/dashboard`, `/my-nfts`
