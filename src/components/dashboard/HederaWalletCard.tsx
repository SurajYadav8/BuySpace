"use client";

import { useHederaWallet } from "@/context/HederaWalletContext";

export default function HederaWalletCard() {
  const { isConnected, isConnecting, address, connect, disconnect, chainId, isCorrectNetwork } =
    useHederaWallet();

  if (!isConnected || !address) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 h-full shadow-soft">
        <h3 className="font-display text-xl font-semibold text-ink mb-2">Hedera wallet</h3>
        <p className="text-sm text-ink-muted mb-4">
          Connect MetaMask or HashPack on Hedera Testnet (296).
        </p>
        <button
          type="button"
          onClick={() => connect()}
          disabled={isConnecting}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {isConnecting ? "Connecting..." : "Connect wallet"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 h-full shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-xl font-semibold text-ink">Hedera wallet</h3>
        <button type="button" onClick={() => disconnect()} className="text-xs text-ink-muted hover:text-ink">
          Disconnect
        </button>
      </div>
      <p className="text-xs text-ink-muted mb-1">Address</p>
      <p className="text-sm font-mono break-all text-ink">{address}</p>
      <p className="text-xs mt-3 text-ink-muted">
        Chain {chainId ?? "?"}{" "}
        {isCorrectNetwork ? (
          <span className="text-primary">(Testnet OK)</span>
        ) : (
          <span className="text-arkiv">(switch to 296)</span>
        )}
      </p>
    </div>
  );
}
