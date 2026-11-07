import { Suspense } from "react";
import LeaseMarketplace from "@/components/listings/LeaseMarketplace";
import IntegrationBadges from "@/components/brand/IntegrationBadges";

export default function ListingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-primary text-xs uppercase tracking-[0.16em] mb-2">Step 3</p>
      <h1 className="font-display text-4xl font-semibold text-ink mb-3">Lease marketplace</h1>
      <p className="text-ink-muted mb-6 max-w-2xl">
        Buyers pay HBAR on Hedera and receive a Lease NFT. Offers are indexed on Arkiv with expiry
        so stale listings drop out. The Title NFT stays with the owner. A lease is not a land sale.
      </p>
      <IntegrationBadges className="mb-8" />
      <Suspense fallback={<p className="text-ink-muted py-20 text-center">Loading listings...</p>}>
        <LeaseMarketplace />
      </Suspense>
    </div>
  );
}
