"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import DemoFlowGuide from "@/components/demo/DemoFlowGuide";
import ExplorerLinks from "@/components/demo/ExplorerLinks";
import IntegrationBadges from "@/components/brand/IntegrationBadges";
import { useHederaWallet } from "@/context/HederaWalletContext";
import {
  mintAirspaceTitle,
  contractsConfigured,
  AIRSPACE_CONTRACTS,
} from "@/services/hedera/walletAirspaceService";
import { JIO_WORLD_CENTRE, MUMBAI_BUILDINGS } from "@/config/mumbai";

function TokenizeForm() {
  const params = useSearchParams();
  const {
    isConnected,
    address,
    signer,
    eip1193,
    chainId,
    connect,
    isConnecting,
    isCorrectNetwork,
    ensureHederaNetwork,
  } = useHederaWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const presetId = Number(params.get("buildingId") || "1");
  const preset = MUMBAI_BUILDINGS.find((b) => b.id === presetId) || MUMBAI_BUILDINGS[0];

  const [form, setForm] = useState({
    title: params.get("title") || `${preset.name} - BuySpace Rights`,
    description: "",
    propertyAddress: params.get("address") || JIO_WORLD_CENTRE.address,
    city: "Mumbai",
    propertyId: `mumbai-bkc-${preset.id}`,
    currentHeight: String(params.get("currentHeight") || preset.currentHeight),
    maximumHeight: String(params.get("maximumHeight") || preset.maximumHeight),
    latitude: String(params.get("lat") || JIO_WORLD_CENTRE.latitude),
    longitude: String(params.get("lng") || JIO_WORLD_CENTRE.longitude),
    rightsType: (params.get("rightsType") as string) || "view",
    nominalValue: params.get("price") || String(Math.round(preset.pricePerSqFt * 250)),
    numberOfShares: String(
      params.get("shares") ||
        Math.max(1, preset.maximumHeight - preset.currentHeight)
    ),
  });

  const availableFloors = Math.max(
    0,
    Number(form.maximumHeight) - Number(form.currentHeight)
  );
  const ready = contractsConfigured();

  useEffect(() => {
    if (isConnected) ensureHederaNetwork().catch(() => undefined);
  }, [isConnected, ensureHederaNetwork]);

  const applyBuilding = (id: number) => {
    const b = MUMBAI_BUILDINGS.find((x) => x.id === id);
    if (!b) return;
    setForm((f) => ({
      ...f,
      title: `${b.name} - BuySpace Rights`,
      propertyAddress: `${b.name}, Bandra Kurla Complex, Mumbai`,
      propertyId: `mumbai-bkc-${b.id}`,
      currentHeight: String(b.currentHeight),
      maximumHeight: String(b.maximumHeight),
      latitude: String(b.coordinates[1]),
      longitude: String(b.coordinates[0]),
      nominalValue: String(Math.round(b.pricePerSqFt * 250)),
      numberOfShares: String(Math.max(1, b.maximumHeight - b.currentHeight)),
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!ready) {
      setError("Contracts not deployed. Run npm run deploy:hedera.");
      return;
    }
    if (!isConnected || !signer || !eip1193 || !address) {
      setError("Connect MetaMask or HashPack first.");
      await connect();
      return;
    }
    if (!isCorrectNetwork) {
      setError("Switch to Hedera Testnet (chain 296).");
      return;
    }

    setLoading(true);
    try {
      await ensureHederaNetwork();
      toast("Confirm mint in your wallet...");
      const minted = await mintAirspaceTitle(
        signer,
        {
          propertyAddress: form.propertyAddress,
          currentHeight: Number(form.currentHeight),
          maximumHeight: Number(form.maximumHeight),
          metadataUri: `buyspace://mumbai/${form.propertyId}/${Date.now()}`,
        },
        eip1193,
        chainId
      );

      const parcel = {
        title: form.title,
        description:
          form.description ||
          `Tokenized airspace above ${form.propertyAddress}. Floors ${form.currentHeight} to ${form.maximumHeight}. Not land.`,
        propertyAddress: form.propertyAddress,
        city: form.city,
        currentHeight: Number(form.currentHeight),
        maximumHeight: Number(form.maximumHeight),
        availableFloors,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        rightsType: form.rightsType as "view" | "development" | "temporary",
        nominalValue: form.nominalValue,
        numberOfShares: Number(form.numberOfShares) || availableFloors,
      };

      const res = await fetch("/api/hedera/record-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: minted.tokenId,
          txHash: minted.txHash,
          ownerEvmAddress: address,
          parcel,
          propertyId: form.propertyId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record title");

      setResult({ ...data, minted });
      toast.success(`BuySpace title #${minted.tokenId} minted to your wallet`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Mint failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-primary text-xs uppercase tracking-[0.16em] mb-2">Step 1</p>
      <h1 className="font-display text-4xl font-semibold text-ink mb-3">
        Tokenize air rights (not land)
      </h1>
      <p className="text-ink-muted mb-6 max-w-3xl">
        Connect the owner wallet, fill the parcel details, then mint a BuySpace Title NFT. Default
        area: {JIO_WORLD_CENTRE.name}, BKC.
      </p>
      <IntegrationBadges className="mb-6" />
      <DemoFlowGuide compact />

      <div className="grid md:grid-cols-3 gap-4 mb-8 text-sm">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <p className="text-ink-muted mb-1">Owner wallet</p>
          <p className={`break-all ${isConnected ? "text-primary" : "text-arkiv"}`}>
            {isConnected && address ? address : "Not connected"}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <p className="text-ink-muted mb-1">Title contract</p>
          <p className={`break-all text-xs ${ready ? "text-primary" : "text-arkiv"}`}>
            {ready ? AIRSPACE_CONTRACTS.title : "Set NEXT_PUBLIC_AIRSPACE_TITLE_ADDRESS"}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <p className="text-ink-muted mb-1">Available floors</p>
          <p className="text-2xl font-display font-semibold text-primary">{availableFloors}</p>
        </div>
      </div>

      {!isConnected ? (
        <button
          type="button"
          onClick={() => connect()}
          disabled={isConnecting}
          className="mb-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {isConnecting ? "Connecting..." : "Connect owner Hedera wallet"}
        </button>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-line bg-surface p-6 shadow-soft grid md:grid-cols-2 gap-4"
      >
        <label className="block md:col-span-2">
          <span className="text-xs text-ink-muted mb-1 block">Preset Mumbai parcel</span>
          <select
            className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-primary"
            defaultValue={preset.id}
            onChange={(e) => applyBuilding(Number(e.target.value))}
          >
            {MUMBAI_BUILDINGS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} (floors {b.currentHeight}-{b.maximumHeight})
              </option>
            ))}
          </select>
        </label>

        {(
          [
            ["title", "Parcel title"],
            ["propertyId", "Property id"],
            ["propertyAddress", "Property address (anchor only)"],
            ["city", "City"],
            ["currentHeight", "Current height (floors)"],
            ["maximumHeight", "Maximum height (floors)"],
            ["latitude", "Latitude"],
            ["longitude", "Longitude"],
            ["nominalValue", "Nominal value (USD display)"],
            ["numberOfShares", "Number of shares"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block">
            <span className="text-xs text-ink-muted mb-1 block">{label}</span>
            <input
              className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required
            />
          </label>
        ))}

        <label className="block">
          <span className="text-xs text-ink-muted mb-1 block">Rights type</span>
          <select
            className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-primary"
            value={form.rightsType}
            onChange={(e) => setForm({ ...form, rightsType: e.target.value })}
          >
            <option value="view">View</option>
            <option value="development">Development</option>
            <option value="temporary">Temporary</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-ink-muted mb-1 block">Computed available floors</span>
          <input
            readOnly
            value={availableFloors}
            className="w-full rounded-xl border border-line bg-primary-soft/40 px-3 py-2.5 text-sm text-ink"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-xs text-ink-muted mb-1 block">Description</span>
          <textarea
            className="w-full min-h-[100px] rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
            value={form.description}
            placeholder="Optional. Defaults to an airspace-not-land description."
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        <button
          type="submit"
          disabled={loading || !ready}
          className="md:col-span-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Confirm in wallet..." : "Mint airspace title to my wallet"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-xl border border-arkiv/30 bg-[#F8EEE8] text-arkiv px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {result?.minted && (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary-soft p-5">
          <p className="text-sm font-medium text-ink mb-2">
            Title #{result.minted.tokenId} minted on Hedera
          </p>
          {result.concept && (
            <p className="text-sm text-ink-muted mb-3">{result.concept}</p>
          )}
          <ExplorerLinks hederaTxHash={result.minted.txHash} showContracts className="mb-4" />
          <Link
            href={`/lease/create?titleTokenId=${result.minted.tokenId}`}
            className="inline-flex rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            Create a lease next
          </Link>
        </div>
      )}
    </div>
  );
}

export default function TokenizePage() {
  return (
    <Suspense fallback={<div className="px-4 py-20 text-ink-muted">Loading...</div>}>
      <TokenizeForm />
    </Suspense>
  );
}
