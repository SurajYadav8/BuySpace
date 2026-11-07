"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { useHederaWallet } from "@/context/HederaWalletContext";
import {
  createOnChainListing,
  contractsConfigured,
} from "@/services/hedera/walletAirspaceService";
import { hashscanTx } from "@/config/explorers";
import DemoFlowGuide from "@/components/demo/DemoFlowGuide";
import ExplorerLinks from "@/components/demo/ExplorerLinks";
import IntegrationBadges from "@/components/brand/IntegrationBadges";

function CreateLeaseForm() {
  const params = useSearchParams();
  const {
    isConnected,
    address,
    signer,
    eip1193,
    chainId,
    connect,
    ensureHederaNetwork,
    repairHederaRpc,
  } = useHederaWallet();
  const [titles, setTitles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({
    titleTokenId: params.get("titleTokenId") || "",
    title: "1-year BKC view BuySpace lease, Jio World Centre",
    propertyAddress: "G Block, Bandra Kurla Complex, Mumbai 400051",
    city: "Mumbai",
    price: "50",
    priceHbar: "1",
    leaseDays: 365,
    currentHeight: 18,
    maximumHeight: 45,
    availableFloors: 27,
  });

  useEffect(() => {
    fetch("/api/hedera/titles")
      .then((r) => r.json())
      .then((d) => {
        setTitles(d.titles || []);
        if (!form.titleTokenId && d.titles?.[0]) {
          const t = d.titles[0];
          setForm((f) => ({
            ...f,
            titleTokenId: t.titleTokenId,
            propertyAddress: t.parcel?.propertyAddress || f.propertyAddress,
            city: t.parcel?.city || f.city,
            currentHeight: t.parcel?.currentHeight ?? f.currentHeight,
            maximumHeight: t.parcel?.maximumHeight ?? f.maximumHeight,
            availableFloors: t.parcel?.availableFloors ?? f.availableFloors,
            title: `Lease for ${t.parcel?.title || "airspace"}`,
          }));
        }
      });
  }, []);

  useEffect(() => {
    if (isConnected) ensureHederaNetwork().catch(() => undefined);
  }, [isConnected, ensureHederaNetwork]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !signer || !address || !eip1193) {
      toast.error("Connect the owner Hedera wallet to list");
      await connect();
      return;
    }
    if (!contractsConfigured()) {
      toast.error("Market contract not configured");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      await ensureHederaNetwork();
      toast("Approve createListing in your wallet...");
      const listing = await createOnChainListing(
        signer,
        {
          titleTokenId: form.titleTokenId,
          priceHbar: String(form.priceHbar),
          leaseDays: Number(form.leaseDays),
        },
        eip1193,
        chainId
      );

      let data: any = {
        lease: null,
        note: "Listed on Hedera. Arkiv indexing skipped or failed.",
      };
      try {
        const res = await fetch("/api/arkiv/leases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            ownerEvmAddress: address,
            listingId: listing.listingId,
            priceWei: listing.priceWei,
            listingTxHash: listing.txHash,
          }),
        });
        data = await res.json();
        if (!res.ok) {
          toast.error(`On-chain OK, Arkiv index failed: ${data.error || "unknown"}`);
        }
      } catch {
        toast.error("On-chain listing OK. Arkiv index failed.");
      }

      setResult({ ...data, listing });
      toast.success(`Listing #${listing.listingId} created on Hedera`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lease listing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-primary text-xs uppercase tracking-[0.16em] mb-2">Step 2</p>
      <h1 className="font-display text-4xl font-semibold text-ink mb-3">Create a lease</h1>
      <p className="text-ink-muted mb-6">
        Your wallet signs createListing on Hedera. BuySpace then indexes the offer on Arkiv with
        an expiry so the marketplace stays current.
      </p>
      <IntegrationBadges className="mb-6" />
      <DemoFlowGuide compact />

      <div className="mb-6 flex flex-wrap gap-3">
        {!isConnected ? (
          <button
            type="button"
            onClick={() => connect()}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Connect owner wallet
          </button>
        ) : (
          <button
            type="button"
            onClick={() => repairHederaRpc().catch(() => undefined)}
            className="rounded-xl border border-line px-4 py-2 text-sm text-ink-muted"
          >
            Fix MetaMask RPC
          </button>
        )}
      </div>

      {titles.length === 0 && (
        <div className="mb-6 rounded-xl border border-arkiv/30 bg-[#F8EEE8] text-arkiv px-4 py-3 text-sm">
          No tokenized titles yet.{" "}
          <Link href="/tokenize" className="underline">
            Tokenize a title first
          </Link>
          .
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-line bg-surface p-6 shadow-soft grid md:grid-cols-2 gap-4"
      >
        <label className="block md:col-span-2">
          <span className="text-xs text-ink-muted mb-1 block">Title token id</span>
          <select
            className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm"
            value={form.titleTokenId}
            onChange={(e) => {
              const t = titles.find((x) => x.titleTokenId === e.target.value);
              setForm((f) => ({
                ...f,
                titleTokenId: e.target.value,
                ...(t
                  ? {
                      propertyAddress: t.parcel.propertyAddress,
                      city: t.parcel.city,
                      currentHeight: t.parcel.currentHeight,
                      maximumHeight: t.parcel.maximumHeight,
                      availableFloors: t.parcel.availableFloors,
                    }
                  : {}),
              }));
            }}
            required
          >
            <option value="">Select tokenized title</option>
            {titles.map((t) => (
              <option key={t.id} value={t.titleTokenId}>
                {t.parcel?.title} #{t.titleTokenId}
              </option>
            ))}
          </select>
        </label>

        {(
          [
            ["title", "Lease listing title"],
            ["propertyAddress", "Property address"],
            ["city", "City"],
            ["price", "Display price (USD)"],
            ["priceHbar", "On-chain price (HBAR)"],
            ["leaseDays", "Lease term (days)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block">
            <span className="text-xs text-ink-muted mb-1 block">{label}</span>
            <input
              className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm"
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required
            />
          </label>
        ))}

        <button
          type="submit"
          disabled={loading || !contractsConfigured()}
          className="md:col-span-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Confirm listing in wallet..." : "List lease from my wallet"}
        </button>
      </form>

      {result?.listing && (
        <div className="mt-8 rounded-2xl border border-primary/30 bg-primary-soft p-6">
          <h2 className="font-display text-2xl font-semibold mb-2">Lease offer live</h2>
          <p className="text-sm text-ink-muted mb-4">
            {result.note || "Listed on Hedera. Arkiv indexing best-effort."}
          </p>
          <p className="text-sm mb-3">On-chain listing #{result.listing.listingId}</p>
          <ExplorerLinks
            hederaTxHash={result.listing.txHash}
            arkivTxHash={result.lease?.arkivTxHash}
            arkivEntityKey={result.lease?.entityKey}
            showContracts
          />
          {result.listing.txHash && (
            <a
              className="text-primary underline text-sm mt-3 inline-block"
              href={hashscanTx(result.listing.txHash)}
              target="_blank"
              rel="noreferrer"
            >
              Hedera listing on HashScan
            </a>
          )}
          <Link href="/listings" className="block mt-6 text-primary underline">
            Open marketplace for buyers
          </Link>
        </div>
      )}
    </div>
  );
}

export default function CreateLeasePage() {
  return (
    <Suspense fallback={<div className="px-4 py-20 text-ink-muted">Loading...</div>}>
      <CreateLeaseForm />
    </Suspense>
  );
}
