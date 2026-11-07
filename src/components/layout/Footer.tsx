import IntegrationBadges from "@/components/brand/IntegrationBadges";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(10,15,26,0.1)] bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-8 px-7 py-12 md:flex-row md:items-end">
        <div className="max-w-sm">
          <Logo className="mb-4" />
          <p className="text-sm leading-relaxed text-ink-muted">
            Tokenize urban air rights on Hedera. Lease terms index on Arkiv and expire cleanly.
          </p>
        </div>
        <IntegrationBadges label="Built with" />
      </div>
      <div className="border-t border-[rgba(10,15,26,0.1)]">
        <p className="mx-auto max-w-[1200px] px-7 py-4 text-xs text-ink-muted">
          Hedera Testnet demo. Air rights only. Not a land sale.
        </p>
      </div>
    </footer>
  );
}
