"use client";

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, fallback, http } from "wagmi";
import { defineChain } from "viem";
import { HEDERA_TESTNET_RPCS, HEDERA_PRIMARY_RPC } from "@/config/hederaRpc";

/** Hedera testnet  -  demo / contracts live here */
export const hederaTestnet = defineChain({
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: {
    default: {
      http: HEDERA_TESTNET_RPCS,
    },
  },
  blockExplorers: {
    default: { name: "HashScan", url: "https://hashscan.io/testnet" },
  },
  testnet: true,
});

/**
 * Include mainnet (295) so HashPack sessions that land on mainnet can be
 * detected and switched to testnet (296). Contracts are testnet-only.
 */
export const hederaMainnet = defineChain({
  id: 295,
  name: "Hedera Mainnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://295.rpc.thirdweb.com", "https://mainnet.hashio.io/api"],
    },
  },
  blockExplorers: {
    default: { name: "HashScan", url: "https://hashscan.io/mainnet" },
  },
  testnet: false,
});

export const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
  "3a8170812b534d0ff9d794f19a901d64";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, walletConnectWallet, injectedWallet],
    },
  ],
  {
    appName: "BuySpace",
    appDescription: "Tokenize and lease urban airspace on Hedera Testnet",
    appUrl,
    appIcon: `${appUrl}/favicon.ico`,
    projectId: WALLETCONNECT_PROJECT_ID,
  }
);

const testnetTransport = fallback(
  HEDERA_TESTNET_RPCS.map((url) => http(url, { retryCount: 2, timeout: 12_000 }))
);

export const wagmiConfig = createConfig({
  chains: [hederaTestnet, hederaMainnet],
  connectors,
  transports: {
    [hederaTestnet.id]: testnetTransport,
    [hederaMainnet.id]: fallback([
      http("https://295.rpc.thirdweb.com", { retryCount: 2 }),
      http("https://mainnet.hashio.io/api", { retryCount: 2 }),
    ]),
  },
  ssr: true,
  multiInjectedProviderDiscovery: true,
});

export { HEDERA_PRIMARY_RPC };
