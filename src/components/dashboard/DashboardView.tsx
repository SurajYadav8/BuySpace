"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useHederaWallet } from "@/context/HederaWalletContext";
import DemoFlowGuide from "@/components/demo/DemoFlowGuide";
import ExplorerLinks from "@/components/demo/ExplorerLinks";
import HederaWalletCard from "./HederaWalletCard";
import IntegrationBadges from "@/components/brand/IntegrationBadges";
import {
  ARKIV_EXPLORER,
  HASHSCAN_TESTNET,
  arkivEntity,
  arkivTx,
  hashscanTx,
} from "@/config/explorers";
import { AIRSPACE_CONTRACTS, contractsConfigured } from "@/config/contracts";

type TitleRow = {
  id: string;
  titleTokenId: string;
  ownerEvmAddress?: string;
  transactionId?: string;
  hashscanUrl?: string;
  parcel?: { title?: string; propertyAddress?: string };
};

type LeaseRow = {
  id: string;
  title?: string;
  status?: string;
  listingId?: string;
  listingTxHash?: string;
  purchaseTxHash?: string;
  arkivTxHash?: string;
  entityKey?: string;
  leaseDays?: number;
  propertyAddress?: string;
  ownerEvmAddress?: string;
  lesseeEvmAddress?: string;
  leaseNftHashscanUrl?: string;
};

export default function DashboardView() {
  const { address, isConnected, chainId, isCorrectNetwork } = useHederaWallet();
  const [titles, setTitles] = useState<TitleRow[]>([]);
  const [leases, setLeases] = useState<LeaseRow[]>([]);
  const [arkivOk, setArkivOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [titleRes, leaseRes, statusRes] = await Promise.all([
        fetch("/api/hedera/titles"),
        fetch("/api/arkiv/leases"),
        fetch("/api/hedera/status"),
      ]);
      const titleData = await titleRes.json();
      const leaseData = await leaseRes.json();
      const statusData = await statusRes.json();
      setTitles(titleData.titles || []);
      setLeases(leaseData.allLocal || leaseData.local || []);
      setArkivOk(Boolean(statusData?.arkiv?.configured));
      setNote(leaseData.error ? `Arkiv note: ${leaseData.error}` : null);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const myTitles = address
    ? titles.filter((t) => t.ownerEvmAddress?.toLowerCase() === address.toLowerCase())
    : titles;
  const myLeases = address
    ? leases.filter(
        (l) =>
          l.lesseeEvmAddress?.toLowerCase() === address.toLowerCase() ||
          l.ownerEvmAddress?.toLowerCase() === address.toLowerCase()
      )
    : leases;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-primary text-xs uppercase tracking-[0.16em] mb-2">BuySpace dashboard</p>
      <h1 className="font-display text-4xl font-semibold text-ink mb-3">Demo status</h1>
      <p className="text-ink-muted max-w-2xl mb-6">
        Titles settle on Hedera. Lease offers are indexed on Arkiv. Every important transaction
        should surface a HashScan or Arkiv link below.
      </p>
      <IntegrationBadges className="mb-8" />
      <DemoFlowGuide compact />

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <p className="text-xs text-ink-muted mb-1">Wallet</p>
          <p className="text-sm break-all">{isConnected && address ? address : "Not connected"}</p>
          <p className="text-xs mt-2 text-ink-muted">
            Chain {chainId ?? "-"}{" "}
            {isCorrectNetwork ? (
              <span className="text-primary">(296 OK)</span>
            ) : (
              <span className="text-arkiv">(need 296)</span>
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <p className="text-xs text-ink-muted mb-1">Hedera contracts</p>
          <p className={`text-sm ${contractsConfigured() ? "text-primary" : "text-arkiv"}`}>
            {contractsConfigured() ? "Title + Market ready" : "Missing addresses"}
          </p>
          <ExplorerLinks showContracts className="mt-3" />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <p className="text-xs text-ink-muted mb-1">Arkiv Rabdi</p>
          <p className={`text-sm ${arkivOk ? "text-primary" : "text-arkiv"}`}>
            {arkivOk ? "Indexer configured" : "Check Arkiv env keys"}
          </p>
          <a href={ARKIV_EXPLORER} target="_blank" rel="noreferrer" className="text-xs text-arkiv underline mt-3 inline-block">
            Open Arkiv explorer
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <HederaWalletCard />
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
          <h3 className="font-display text-xl font-semibold mb-3">Quick actions</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/tokenize" className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
              Tokenize
            </Link>
            <Link href="/lease/create" className="rounded-lg border border-line px-3 py-2 text-sm">
              Create lease
            </Link>
            <Link href="/listings" className="rounded-lg border border-line px-3 py-2 text-sm">
              Marketplace
            </Link>
            <button type="button" onClick={() => load()} className="rounded-lg border border-line px-3 py-2 text-sm">
              Refresh
            </button>
          </div>
          <p className="text-xs text-ink-muted mt-4">
            Settlements on{" "}
            <a href={HASHSCAN_TESTNET} className="text-primary underline" target="_blank" rel="noreferrer">
              HashScan
            </a>
            . Index on{" "}
            <a href={ARKIV_EXPLORER} className="text-arkiv underline" target="_blank" rel="noreferrer">
              Arkiv
            </a>
            .
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-ink-muted py-16 text-center">Loading BuySpace data...</p>
      ) : (
        <>
          {note && (
            <div className="mb-6 rounded-xl border border-arkiv/30 bg-[#F8EEE8] text-arkiv px-4 py-3 text-sm">
              {note}
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <Stat label="Titles" value={String(titles.length)} />
            <Stat label="Open leases" value={String(leases.filter((l) => l.status === "open").length)} />
            <Stat label="Active leased" value={String(leases.filter((l) => l.status === "leased").length)} />
          </div>

          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold mb-4">Title NFTs</h2>
            {myTitles.length === 0 ? (
              <Empty text="No titles yet." href="/tokenize" cta="Tokenize a parcel" />
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {myTitles.map((t) => (
                  <article key={t.id} className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
                    <p className="text-xs text-primary uppercase mb-1">Title #{t.titleTokenId}</p>
                    <h3 className="font-medium mb-1">{t.parcel?.title || "BuySpace title"}</h3>
                    <p className="text-sm text-ink-muted mb-3">{t.parcel?.propertyAddress}</p>
                    <ExplorerLinks hederaTxHash={t.transactionId} />
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold mb-4">Lease activity</h2>
            {myLeases.length === 0 ? (
              <Empty text="No leases yet." href="/lease/create" cta="Create a lease" />
            ) : (
              <div className="space-y-3">
                {myLeases.map((l) => (
                  <article key={l.id} className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
                    <div className="flex flex-wrap gap-2 text-xs mb-2">
                      <span className="text-primary uppercase">{l.status}</span>
                      {l.listingId && <span className="text-ink-muted">listing #{l.listingId}</span>}
                    </div>
                    <h3 className="font-medium mb-1">{l.title || "Lease"}</h3>
                    <p className="text-sm text-ink-muted mb-3">{l.propertyAddress}</p>
                    <ExplorerLinks
                      hederaTxHash={l.purchaseTxHash || l.listingTxHash}
                      arkivTxHash={l.arkivTxHash}
                      arkivEntityKey={l.entityKey}
                    />
                    <div className="flex flex-wrap gap-3 mt-3 text-xs">
                      {l.listingTxHash && (
                        <a className="text-primary underline" href={hashscanTx(l.listingTxHash)} target="_blank" rel="noreferrer">
                          Listing HashScan
                        </a>
                      )}
                      {l.arkivTxHash && (
                        <a className="text-arkiv underline" href={arkivTx(l.arkivTxHash)} target="_blank" rel="noreferrer">
                          Arkiv create tx
                        </a>
                      )}
                      {l.entityKey && (
                        <a className="text-arkiv underline" href={arkivEntity(l.entityKey)} target="_blank" rel="noreferrer">
                          Arkiv entity
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-primary-soft/50 p-5 text-sm text-ink-muted">
            <p className="font-medium text-ink mb-2">What a lease means</p>
            <p>
              A lease is a time-bound right to use airspace, not ownership of land. The owner keeps
              the Title NFT. The buyer receives a Lease NFT and pays HBAR on Hedera. Arkiv stores
              offer metadata with an expiry so the marketplace stays current.
            </p>
            <p className="mt-2 text-xs">
              Title {AIRSPACE_CONTRACTS.title || "unset"} · Market {AIRSPACE_CONTRACTS.market || "unset"}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
      <p className="text-xs text-ink-muted mb-1">{label}</p>
      <p className="text-3xl font-display font-semibold text-primary">{value}</p>
    </div>
  );
}

function Empty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-muted">
      <p className="mb-3">{text}</p>
      <Link href={href} className="text-primary underline">
        {cta}
      </Link>
    </div>
  );
}
