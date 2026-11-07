"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DemoFlowGuide from "@/components/demo/DemoFlowGuide";
import ExplorerLinks from "@/components/demo/ExplorerLinks";
import IntegrationBadges from "@/components/brand/IntegrationBadges";

type LeaseNft = {
  id: string;
  title: string;
  propertyAddress: string;
  leaseNftTokenId?: string;
  leaseNftSerial?: string;
  leaseNftHashscanUrl?: string;
  leaseStartIso?: string;
  leaseEndIso?: string;
  titleTokenId: string;
  status: string;
  purchaseTxHash?: string;
  arkivTxHash?: string;
  entityKey?: string;
};

export default function MyNFTsPage() {
  const [leases, setLeases] = useState<LeaseNft[]>([]);
  const [titles, setTitles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [leaseRes, titleRes] = await Promise.all([
          fetch("/api/arkiv/leases"),
          fetch("/api/hedera/titles"),
        ]);
        const leaseData = await leaseRes.json();
        const titleData = await titleRes.json();
        setLeases(
          (leaseData.allLocal || []).filter(
            (l: LeaseNft) => l.status === "leased" && (l.leaseNftSerial || l.leaseNftTokenId)
          )
        );
        setTitles(titleData.titles || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-semibold text-ink mb-3">My positions</h1>
      <p className="text-ink-muted mb-6 max-w-2xl">
        Lease NFTs mint to the buyer on purchase. Title NFTs stay with the owner. Arkiv indexes
        offers. Settlement links live on HashScan.
      </p>
      <IntegrationBadges className="mb-6" />
      <DemoFlowGuide compact />

      {loading ? (
        <p className="text-ink-muted py-16">Loading...</p>
      ) : (
        <>
          <section className="mb-14">
            <h2 className="font-display text-2xl font-semibold mb-4">Lease NFTs</h2>
            {leases.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-8 text-ink-muted">
                No lease NFTs yet.{" "}
                <Link href="/listings" className="text-primary underline">
                  Browse leases
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {leases.map((l) => (
                  <div
                    key={l.id}
                    className="rounded-2xl border border-line bg-surface p-5 shadow-soft"
                  >
                    <p className="text-primary text-xs uppercase mb-1">Lease certificate</p>
                    <h3 className="font-medium mb-2">{l.title}</h3>
                    <p className="text-sm text-ink-muted mb-3">{l.propertyAddress}</p>
                    <p className="text-sm">
                      Token {l.leaseNftTokenId} · serial #{l.leaseNftSerial}
                    </p>
                    <ExplorerLinks
                      className="mt-3"
                      hederaTxHash={l.purchaseTxHash}
                      arkivTxHash={l.arkivTxHash}
                      arkivEntityKey={l.entityKey}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">Title NFTs</h2>
            {titles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-8 text-ink-muted">
                No titles yet.{" "}
                <Link href="/tokenize" className="text-primary underline">
                  Tokenize title
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {titles.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-line bg-surface p-5 shadow-soft"
                  >
                    <p className="text-primary text-xs uppercase mb-1">BuySpace title</p>
                    <h3 className="font-medium mb-2">{t.parcel?.title}</h3>
                    <p className="text-sm text-ink-muted">{t.parcel?.propertyAddress}</p>
                    <p className="text-xs mt-2 font-mono">#{t.titleTokenId}</p>
                    <ExplorerLinks className="mt-3" hederaTxHash={t.transactionId} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
