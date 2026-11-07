"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { hederaTestnet } from "@/config/wagmi";
import {
  HEDERA_PRIMARY_RPC,
  metamaskHederaTestnetParams,
} from "@/config/hederaRpc";
import { toast } from "react-hot-toast";

/** Minimal EIP-1193 provider (MetaMask / WalletConnect / HashPack EVM). */
export type Eip1193Provider = {
  request: (args: { method: string; params?: any }) => Promise<any>;
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
};

type HederaWalletContextValue = {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  isCorrectNetwork: boolean;
  walletType: string | null;
  eip1193: Eip1193Provider | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  walletClient: null;
  connectMetaMask: () => Promise<void>;
  connectWalletConnect: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  ensureHederaNetwork: () => Promise<void>;
  /** Push updated RPC list into MetaMask (fixes Hashio "too many errors"). */
  repairHederaRpc: () => Promise<void>;
};

const HederaWalletContext = createContext<HederaWalletContextValue>({
  address: null,
  isConnected: false,
  isConnecting: false,
  chainId: null,
  isCorrectNetwork: false,
  walletType: null,
  eip1193: null,
  provider: null,
  signer: null,
  walletClient: null,
  connectMetaMask: async () => {},
  connectWalletConnect: async () => {},
  connect: async () => {},
  disconnect: async () => {},
  ensureHederaNetwork: async () => {},
  repairHederaRpc: async () => {},
});

export const useHederaWallet = () => useContext(HederaWalletContext);

const RPC_FIX_HINT = `MetaMask → Settings → Networks → Hedera Testnet → set RPC to ${HEDERA_PRIMARY_RPC} (chain 296)`;

async function pushHederaChain(eip1193: Eip1193Provider) {
  const params = metamaskHederaTestnetParams();
  // Always try add first so MetaMask can pick up the healthier RPC list.
  try {
    await eip1193.request({
      method: "wallet_addEthereumChain",
      params: [params],
    });
  } catch (err: any) {
    const msg = String(err?.message || err || "").toLowerCase();
    // Already added  -  switch; user may still need to edit RPC manually
    if (
      !msg.includes("already") &&
      err?.code !== 4902 &&
      !msg.includes("same")
    ) {
      console.warn("wallet_addEthereumChain", err);
    }
  }
  try {
    await eip1193.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: params.chainId }],
    });
  } catch (err) {
    console.warn("wallet_switchEthereumChain", err);
    throw err;
  }
}

export function HederaWalletProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, isConnecting, connector, chainId } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();

  const [eip1193, setEip1193] = useState<Eip1193Provider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!connector || !address || !isConnected) {
        setEip1193(null);
        setSigner(null);
        setProvider(null);
        return;
      }
      try {
        const raw = (await connector.getProvider()) as Eip1193Provider;
        if (!raw?.request) throw new Error("Wallet provider has no request()");
        if (cancelled) return;

        const network = {
          chainId: chainId ?? hederaTestnet.id,
          name: chainId === 295 ? "Hedera Mainnet" : hederaTestnet.name,
        };
        const browser = new BrowserProvider(raw as any, network);
        const s = new JsonRpcSigner(browser, address);

        setEip1193(raw);
        setProvider(browser);
        setSigner(s);
      } catch (err) {
        console.error("EIP-1193 bridge failed", err);
        if (!cancelled) {
          setEip1193(null);
          setSigner(null);
          setProvider(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connector, address, isConnected, chainId]);

  const repairHederaRpc = useCallback(async () => {
    if (!eip1193) {
      toast.error("Connect MetaMask first, then fix RPC");
      throw new Error("No wallet provider");
    }
    try {
      await pushHederaChain(eip1193);
      toast.success(
        `Hedera Testnet RPC set to ${HEDERA_PRIMARY_RPC}. If MetaMask still fails: ${RPC_FIX_HINT}`
      );
    } catch (err: any) {
      toast.error(RPC_FIX_HINT, { duration: 10000 });
      throw new Error(err?.message || RPC_FIX_HINT);
    }
  }, [eip1193]);

  const ensureHederaNetwork = useCallback(async () => {
    // Always push healthy RPCs into MetaMask before txs (Hashio flakes hard).
    if (eip1193) {
      try {
        await pushHederaChain(eip1193);
        return;
      } catch (err) {
        console.warn("pushHederaChain failed, trying wagmi switch", err);
      }
    }

    if (chainId === hederaTestnet.id) return;

    const current = chainId;
    if (current === 295) {
      toast("Wallet is on Hedera Mainnet (295)  -  switching to Testnet (296)…");
    }

    try {
      await switchChainAsync({ chainId: hederaTestnet.id });
      return;
    } catch (err) {
      console.warn("wagmi switchChain failed", err);
    }

    toast.error(RPC_FIX_HINT, { duration: 10000 });
    throw new Error(
      "Wrong network / bad RPC. " +
        RPC_FIX_HINT +
        (current ? ` (currently chain ${current})` : "")
    );
  }, [chainId, switchChainAsync, eip1193]);

  useEffect(() => {
    if (isConnected && chainId && chainId !== hederaTestnet.id) {
      ensureHederaNetwork().catch(() => undefined);
    }
  }, [isConnected, chainId, ensureHederaNetwork]);

  const connect = useCallback(async () => {
    if (openConnectModal) openConnectModal();
    else toast.error("Wallet connect modal unavailable");
  }, [openConnectModal]);

  const disconnect = useCallback(async () => {
    try {
      await disconnectAsync();
      setEip1193(null);
      setSigner(null);
      setProvider(null);
      toast.success("Wallet disconnected");
    } catch (err: any) {
      toast.error(err?.message || "Disconnect failed");
    }
  }, [disconnectAsync]);

  const isCorrectNetwork = chainId === hederaTestnet.id;

  const value = useMemo(
    () => ({
      address: address ?? null,
      isConnected: Boolean(isConnected && address),
      isConnecting,
      chainId: chainId ?? null,
      isCorrectNetwork,
      walletType: connector?.name ?? null,
      eip1193,
      provider,
      signer,
      walletClient: null,
      connectMetaMask: connect,
      connectWalletConnect: connect,
      connect,
      disconnect,
      ensureHederaNetwork,
      repairHederaRpc,
    }),
    [
      address,
      isConnected,
      isConnecting,
      chainId,
      isCorrectNetwork,
      connector?.name,
      eip1193,
      provider,
      signer,
      connect,
      disconnect,
      ensureHederaNetwork,
      repairHederaRpc,
    ]
  );

  return (
    <HederaWalletContext.Provider value={value}>{children}</HederaWalletContext.Provider>
  );
}
