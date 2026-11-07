/** Canonical explorers for the live Mumbai airspace demo. */

export const HASHSCAN_TESTNET =
  process.env.NEXT_PUBLIC_HASHSCAN_BASE || "https://hashscan.io/testnet";

export const ARKIV_EXPLORER =
  process.env.NEXT_PUBLIC_ARKIV_EXPLORER || "https://rabdi.explorer.arkiv.network";

export function hashscanTx(txHash: string) {
  if (!txHash) return HASHSCAN_TESTNET;
  // Hedera native ids look like 0.0.x@seconds.nanos
  if (txHash.includes("@")) {
    return `${HASHSCAN_TESTNET}/transaction/${encodeURIComponent(txHash)}`;
  }
  return `${HASHSCAN_TESTNET}/transaction/${txHash}`;
}

export function hashscanContract(address: string) {
  return `${HASHSCAN_TESTNET}/contract/${address}`;
}

export function hashscanAccount(addressOrId: string) {
  return `${HASHSCAN_TESTNET}/account/${addressOrId}`;
}

export function arkivTx(txHash: string) {
  if (!txHash) return ARKIV_EXPLORER;
  return `${ARKIV_EXPLORER}/tx/${txHash}`;
}

export function arkivAddress(address: string) {
  if (!address) return ARKIV_EXPLORER;
  return `${ARKIV_EXPLORER}/address/${address}`;
}

/** Best-effort entity deep link (Arkiv Rabdi explorer). */
export function arkivEntity(entityKey: string) {
  if (!entityKey) return ARKIV_EXPLORER;
  return `${ARKIV_EXPLORER}/entity/${entityKey}`;
}
