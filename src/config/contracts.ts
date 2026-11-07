/** On-chain BuySpace demo contracts (Hedera testnet EVM / Hashio). */
export const AIRSPACE_CONTRACTS = {
  chainId: 296,
  rpcUrl:
    process.env.NEXT_PUBLIC_HEDERA_RPC_URL ||
    process.env.HEDERA_RPC_URL ||
    "https://296.rpc.thirdweb.com", // Hashio flakes; prefer thirdweb
  title:
    process.env.NEXT_PUBLIC_AIRSPACE_TITLE_ADDRESS ||
    "",
  market:
    process.env.NEXT_PUBLIC_AIRSPACE_MARKET_ADDRESS ||
    "",
  hashscanBase:
    process.env.NEXT_PUBLIC_HASHSCAN_BASE || "https://hashscan.io/testnet",
};

export function contractsConfigured() {
  return Boolean(AIRSPACE_CONTRACTS.title && AIRSPACE_CONTRACTS.market);
}

export function hashscanContract(address: string) {
  return `${AIRSPACE_CONTRACTS.hashscanBase}/contract/${address}`;
}

export function hashscanTx(txHash: string) {
  return `${AIRSPACE_CONTRACTS.hashscanBase}/transaction/${txHash}`;
}
