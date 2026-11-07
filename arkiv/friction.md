# Arkiv feedback (friction)

## What should improve today

1. **Clearer DNS / connectivity errors.** When `rpc.rabdi.db-chain.testnet.arkiv.network` fails at the fetch layer, viem only surfaces `fetch failed`. A typed error (`DNS`, `TLS`, `401 access key`, `rate limit`) would cut debug time a lot during hackathons.
2. **Access-key path ergonomics.** Embedding the key in the URL path works, but docs + SDK could surface a health check helper (`arkiv_ping` / `eth_chainId` wrapper) so apps can show “indexer online” vs “key missing” without a full query.
3. **Expiration UX in explorers.** Linking from entity → exact wall-clock expiry and “will drop from marketplace at …” would help judges verify the expire-by-design story without reading code.

## What broke / surprised us

| Expectation | What happened | Reproduce |
| --- | --- | --- |
| Query open leases from Next.js API | Intermittent `HTTP request failed` / `fetch failed` while the same request succeeded from a standalone Node script | Hit `/api/arkiv/leases` while DNS or network is flaky; compare with `node` POST to `https://rpc.rabdi…/{accessKey}` using `eth_chainId` then `arkiv_query` |
| Marketplace should degrade gracefully | Local JSON store still shows listings when Arkiv is down | Stop network to Rabdi and reload `/listings` |

## Nice to have

- Official TypeScript examples for “listing that expires with the commercial term” (markets track).
- Indexed `expiresAt` in select projections without needing block math in the UI.
