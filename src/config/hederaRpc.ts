/**
 * Hedera Testnet (296) JSON-RPC endpoints.
 * Hashio is official but frequently rate-limits / 502s — MetaMask then shows
 * "RPC endpoint returned too many errors". Prefer thirdweb, fall back to others.
 */
export const HEDERA_TESTNET_RPCS = [
  process.env.NEXT_PUBLIC_HEDERA_RPC_URL,
  "https://296.rpc.thirdweb.com",
  "https://testnet.hashio.io/api",
  "https://hedera-testnet.rpcscan.xyz",
].filter((u, i, arr): u is string => Boolean(u) && arr.indexOf(u) === i);

export const HEDERA_PRIMARY_RPC = HEDERA_TESTNET_RPCS[0];

export const HEDERA_TESTNET_CHAIN = {
  chainId: 296,
  chainIdHex: "0x128" as const,
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  blockExplorerUrls: ["https://hashscan.io/testnet"],
  rpcUrls: HEDERA_TESTNET_RPCS,
};

/** MetaMask wallet_addEthereumChain params (uses primary + backups). */
export function metamaskHederaTestnetParams() {
  return {
    chainId: HEDERA_TESTNET_CHAIN.chainIdHex,
    chainName: HEDERA_TESTNET_CHAIN.name,
    nativeCurrency: HEDERA_TESTNET_CHAIN.nativeCurrency,
    rpcUrls: HEDERA_TESTNET_RPCS.slice(0, 3),
    blockExplorerUrls: HEDERA_TESTNET_CHAIN.blockExplorerUrls,
  };
}

/** JSON-RPC call with automatic endpoint failover. */
export async function hederaRpcFetch<T = unknown>(
  method: string,
  params: unknown[] = []
): Promise<T> {
  let lastErr: unknown;
  for (const url of HEDERA_TESTNET_RPCS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      if (!res.ok) {
        lastErr = new Error(`${url} HTTP ${res.status}`);
        continue;
      }
      const json = await res.json();
      if (json.error) {
        lastErr = new Error(json.error.message || String(json.error));
        continue;
      }
      return json.result as T;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("All Hedera Testnet RPCs failed");
}
