export const HEDERA_CONFIG = {
  network: (process.env.HEDERA_NETWORK || "testnet") as "testnet" | "mainnet",
  accountId: process.env.HEDERA_ACCOUNT_ID || "",
  privateKey: process.env.HEDERA_PRIVATE_KEY || "",
  evmAddress: process.env.HEDERA_EVM_ADDRESS || "",
  publicKey: process.env.HEDERA_PUBLIC_KEY || "",
  // Defaults from ATS web .env.example (Hedera testnet Business Logic deployment)
  factoryAddress: process.env.ATS_FACTORY_ADDRESS || "0.0.9213391",
  resolverAddress: process.env.ATS_RESOLVER_ADDRESS || "0.0.9212226",
  mirrorNode: process.env.HEDERA_MIRROR_NODE || "https://testnet.mirrornode.hedera.com/api/v1/",
  rpcUrl: process.env.HEDERA_RPC_URL || process.env.NEXT_PUBLIC_HEDERA_RPC_URL || "https://296.rpc.thirdweb.com",
  leaseNftTokenId: process.env.HEDERA_LEASE_NFT_TOKEN_ID || "",
  buyerAccountId: process.env.HEDERA_BUYER_ACCOUNT_ID || "",
  buyerPrivateKey: process.env.HEDERA_BUYER_PRIVATE_KEY || "",
  hashscanBase: process.env.NEXT_PUBLIC_HASHSCAN_BASE || "https://hashscan.io/testnet",
};

export const ARKIV_CONFIG = {
  accessKey: process.env.ARKIV_ACCESS_KEY || "",
  privateKey: process.env.ARKIV_PRIVATE_KEY || "",
  explorer: process.env.NEXT_PUBLIC_ARKIV_EXPLORER || "https://rabdi.explorer.arkiv.network",
  chainId: 7794095,
  rpc: "https://rpc.rabdi.db-chain.testnet.arkiv.network",
};

export function requireHederaEnv() {
  const missing: string[] = [];
  if (!HEDERA_CONFIG.accountId) missing.push("HEDERA_ACCOUNT_ID");
  if (!HEDERA_CONFIG.privateKey) missing.push("HEDERA_PRIVATE_KEY");
  if (!HEDERA_CONFIG.evmAddress) missing.push("HEDERA_EVM_ADDRESS");
  if (missing.length) {
    throw new Error(
      `Missing Hedera env: ${missing.join(", ")}. Copy .env.example to .env.local and fill values from https://portal.hedera.com`
    );
  }
}

export function requireArkivEnv() {
  const missing: string[] = [];
  if (!ARKIV_CONFIG.accessKey) missing.push("ARKIV_ACCESS_KEY");
  if (!ARKIV_CONFIG.privateKey) missing.push("ARKIV_PRIVATE_KEY");
  if (missing.length) {
    throw new Error(
      `Missing Arkiv env: ${missing.join(", ")}. Get a key at https://hub.arkiv.network/access-keys and tGLM at https://hub.arkiv.network/faucet`
    );
  }
}

export function hashscanTokenUrl(tokenId: string) {
  return `${HEDERA_CONFIG.hashscanBase}/token/${tokenId}`;
}

export function hashscanTxUrl(txId: string) {
  return `${HEDERA_CONFIG.hashscanBase}/transaction/${txId}`;
}

export function hashscanAccountUrl(accountId: string) {
  return `${HEDERA_CONFIG.hashscanBase}/account/${accountId}`;
}
