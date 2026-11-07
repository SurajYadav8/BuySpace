"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useHederaWallet } from "@/context/HederaWalletContext";
import {
  purchaseOnChainListing,
  contractsConfigured,
} from "@/services/hedera/walletAirspaceService";
import { hashscanTx, arkivEntity } from "@/config/explorers";
import DemoFlowGuide from "@/components/demo/DemoFlowGuide";
import ExplorerLinks from "@/components/demo/ExplorerLinks";

type LeaseCard = {
  id?: string;
  entityKey?: string;
  title?: string;
  propertyAddress?: string;
  city?: string;
  price?: string;
  leaseDays?: number;
  titleTokenId?: string;
  status?: string;
  currentHeight?: number;
  maximumHeight?: number;
  availableFloors?: number;
  listingId?: string;
  priceWei?: string;
  leaseNftHashscanUrl?: string;
  leaseNftTokenId?: string;
  leaseNftSerial?: string;
  purchaseTxHash?: string;
  listingTxHash?: string;
  arkivTxHash?: string;
};

export default function LeaseMarketplace() {
  const {
    isConnected,
    address,
    signer,
    eip1193,
    chainId,
    isCorrectNetwork,
    connect,
    ensureHederaNetwork,
    repairHederaRpc,
  } = useHederaWallet();
  const [openLeases, setOpenLeases] = useState<LeaseCard[]>([]);
  const [leased, setLeased] = useState<LeaseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [lastPurchase, setLastPurchase] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/arkiv/leases");
      const data = await res.json();
      setQuery(data.query || "");
      setError(data.error || null);

      const local: LeaseCard[] = data.allLocal || data.local || [];
      const open = local.filter((l) => l.status === "open");
      const taken = local.filter((l) => l.status === "leased");

      if (data.fromArkiv?.length) {
        const merged = data.fromArkiv.map((a: any) => {
          const match = local.find((l) => l.entityKey === a.entityKey);
          return { ...a, id: match?.id || a.entityKey, ...match };
        });
        setOpenLeases(merged.filter((l: LeaseCard) => l.status === "open" || !l.status));
      } else {
        setOpenLeases(open);
      }
      setLeased(taken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (isConnected) ensureHederaNetwork().catch(() => undefined);
  }, [isConnected, ensureHederaNetwork]);

  const purchase = async (lease: LeaseCard) => {
    if (!lease.id && !lease.entityKey) {
      toast.error("Missing lease id");
      return;
    }
    if (!lease.listingId) {
      toast.error("This listing has no on-chain listingId. Owner must re-list.");
      return;
    }
    if (!isConnected || !signer || !address || !eip1193) {
      toast.error("Connect your buyer Hedera wallet");
      await connect();
      return;
    }
    if (!contractsConfigured()) {
      toast.error("Market contract not configured");
      return;
    }

    setBuyingId(lease.id || lease.entityKey || null);
    setLastPurchase(null);
    try {
      await ensureHederaNetwork();
      toast("Confirm purchase in your wallet...");
      const bought = await purchaseOnChainListing(signer, lease.listingId, eip1193, chainId);

      let data: any = { note: "Purchased on Hedera." };
      try {
        const res = await fetch("/api/arkiv/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "onchain",
            leaseId: lease.id,
            entityKey: lease.entityKey,
            buyerEvmAddress: address,
            listingId: lease.listingId,
            leaseTokenId: bought.leaseTokenId,
            purchaseTxHash: bought.txHash,
            expiresAt: bought.expiresAt,
          }),
        });
        data = await res.json();
        if (!res.ok) toast.error("On-chain purchase OK. Arkiv record failed.");
      } catch {
        /* best effort */
      }

      setLastPurchase({ ...data, bought });
      toast.success("Lease NFT minted to your connected wallet");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) {
    return <p className="text-center text-ink-muted py-20">Loading lease marketplace...</p>;
  }

  return (
    <div>
      <DemoFlowGuide compact />
      <div className="flex flex-wrap gap-4 items-end justify-between mb-8">
        <div>
          <p className="text-ink-muted text-sm mb-1">
            Buyer pays HBAR on Hedera Testnet (296). Arkiv only indexes the offer.
          </p>
          {query && <code className="text-xs text-primary">{query}</code>}
          {error && <p className="text-arkiv text-sm mt-2">Arkiv note: {error}</p>}
          {isConnected && address && (
            <p className="text-xs text-primary mt-2">Buyer wallet: {address}</p>
          )}
          {isConnected && !isCorrectNetwork && (
            <div className="mt-3 rounded-xl border border-arkiv/30 bg-[#F8EEE8] px-3 py-2 text-sm text-arkiv">
              Wallet is on chain {chainId ?? "?"}. Need Testnet 296.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => ensureHederaNetwork().catch(() => undefined)}
              >
                Switch network
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/tokenize" className="rounded-lg border border-line px-4 py-2 text-sm">
            Tokenize
          </Link>
          <Link href="/lease/create" className="rounded-lg border border-line px-4 py-2 text-sm">
            Create lease
          </Link>
          {!isConnected ? (
            <button
              onClick={() => connect()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Connect buyer wallet
            </button>
          ) : (
            <button
              type="button"
              onClick={() => repairHederaRpc().catch(() => undefined)}
              className="rounded-lg border border-line px-4 py-2 text-sm text-ink-muted"
            >
              Fix MetaMask RPC
            </button>
          )}
        </div>
      </div>

      {lastPurchase?.bought && (
        <div className="mb-8 rounded-2xl border border-primary/30 bg-primary-soft p-5">
          <h3 className="font-display text-xl font-semibold mb-2">Purchase complete</h3>
          <p className="text-sm text-ink-muted mb-3">
            {lastPurchase.note || "Purchased on Hedera. Lease NFT is in your wallet."}
          </p>
          <p className="text-sm mb-3">
            Lease NFT token: #{lastPurchase.bought?.leaseTokenId || lastPurchase.nft?.serial}
          </p>
          <ExplorerLinks
            hederaTxHash={lastPurchase.bought?.txHash}
            arkivTxHash={lastPurchase.arkivTxHash || lastPurchase.lease?.arkivTxHash}
            arkivEntityKey={lastPurchase.entityKey || lastPurchase.lease?.entityKey}
          />
          {lastPurchase.bought?.txHash && (
            <a
              className="text-primary underline text-sm mt-2 inline-block"
              href={hashscanTx(lastPurchase.bought.txHash)}
              target="_blank"
              rel="noreferrer"
            >
              Open purchase tx on HashScan
            </a>
          )}
        </div>
      )}

      {openLeases.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-line">
          <p className="text-ink-muted mb-4">No open BuySpace leases yet.</p>
          <Link href="/lease/create" className="text-primary underline">
            Owner: create a lease from your wallet
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {openLeases.map((lease) => (
            <article
              key={lease.id || lease.entityKey}
              className="rounded-2xl border border-line bg-surface p-6 shadow-soft"
            >
              <div className="text-xs uppercase tracking-wider text-primary mb-2">
                {lease.city} · {lease.leaseDays} day lease
                {lease.listingId ? ` · listing #${lease.listingId}` : ""}
              </div>
              <h2 className="font-display text-2xl font-semibold mb-2 text-ink">{lease.title}</h2>
              <p className="text-ink-muted text-sm mb-4">{lease.propertyAddress}</p>
              <dl className="grid grid-cols-2 gap-2 text-sm mb-5">
                <div>
                  <dt className="text-ink-muted text-xs">Envelope</dt>
                  <dd>
                    {lease.currentHeight} to {lease.maximumHeight} ({lease.availableFloors} floors)
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-muted text-xs">Price</dt>
                  <dd>
                    {lease.priceWei
                      ? `${(Number(lease.priceWei) / 1e18).toFixed(4)} HBAR`
                      : `$${Number(lease.price || 0).toLocaleString()}`}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-ink-muted text-xs">Title token</dt>
                  <dd className="font-mono text-xs">#{lease.titleTokenId}</dd>
                </div>
              </dl>
              <ExplorerLinks
                className="mb-4"
                hederaTxHash={lease.listingTxHash}
                arkivTxHash={lease.arkivTxHash}
                arkivEntityKey={lease.entityKey}
              />
              <button
                disabled={buyingId === (lease.id || lease.entityKey) || !lease.listingId}
                onClick={() => purchase(lease)}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {buyingId === (lease.id || lease.entityKey)
                  ? "Confirm in wallet..."
                  : lease.listingId
                    ? "Buy with my Hedera wallet"
                    : "Listing missing on-chain id"}
              </button>
              <p className="text-xs text-ink-muted mt-3">
                You receive the Lease NFT. Title stays with the owner.
                {lease.entityKey && (
                  <>
                    {" "}
                    <a
                      className="text-arkiv underline"
                      href={arkivEntity(lease.entityKey)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Arkiv entity
                    </a>
                  </>
                )}
              </p>
            </article>
          ))}
        </div>
      )}

      {leased.length > 0 && (
        <section className="mt-16">
          <h3 className="font-display text-2xl font-semibold mb-4">Active leased positions</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {leased.map((l) => (
              <div key={l.id} className="rounded-2xl border border-line bg-surface p-4 text-sm shadow-soft">
                <div className="font-medium">{l.title}</div>
                <div className="text-ink-muted">
                  Lease NFT #{l.leaseNftTokenId || l.leaseNftSerial}
                </div>
                {(l.purchaseTxHash || l.leaseNftHashscanUrl) && (
                  <a
                    href={l.purchaseTxHash ? hashscanTx(l.purchaseTxHash) : l.leaseNftHashscanUrl}
                    className="text-primary underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    HashScan
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
