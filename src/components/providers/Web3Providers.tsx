"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { useState, type ReactNode } from "react";
import { wagmiConfig, hederaTestnet } from "@/config/wagmi";
import { HederaWalletProvider } from "@/context/HederaWalletContext";

const rkTheme = lightTheme({
  accentColor: "#0B8F6A",
  accentColorForeground: "#F7F6F2",
  borderRadius: "medium",
  fontStack: "system",
});

export default function Web3Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rkTheme} initialChain={hederaTestnet} modalSize="compact">
          <HederaWalletProvider>{children}</HederaWalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
