import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const emptyStub = path.join(__dirname, "stubs/empty.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  transpilePackages: ["@rainbow-me/rainbowkit", "wagmi", "@wagmi/core", "@wagmi/connectors"],
  experimental: {
    serverComponentsExternalPackages: [
      "@hashgraph/sdk",
      "@hashgraph/asset-tokenization-sdk",
      "@arkiv-network/sdk",
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      encoding: false,
    };
    // Cut Coinbase Smart Wallet / x402 chain — RainbowKit still works with MM + WC + Injected
    config.resolve.alias = {
      ...config.resolve.alias,
      "@base-org/account": emptyStub,
      "@coinbase/cdp-sdk": emptyStub,
      "@coinbase/wallet-sdk": emptyStub,
      "@react-native-async-storage/async-storage": emptyStub,
      "@x402/evm": emptyStub,
      "@x402/svm": emptyStub,
      "@x402/core": emptyStub,
      "@x402/evm/exact/client": emptyStub,
      "@x402/svm/exact/client": emptyStub,
      "@x402/core/client": emptyStub,
    };
    return config;
  },
};

export default nextConfig;
