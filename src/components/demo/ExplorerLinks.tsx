import {
  ARKIV_EXPLORER,
  arkivEntity,
  arkivTx,
  hashscanContract,
  hashscanTx,
} from "@/config/explorers";
import { AIRSPACE_CONTRACTS } from "@/config/contracts";

type Props = {
  hederaTxHash?: string;
  arkivTxHash?: string;
  arkivEntityKey?: string;
  showContracts?: boolean;
  className?: string;
};

export default function ExplorerLinks({
  hederaTxHash,
  arkivTxHash,
  arkivEntityKey,
  showContracts,
  className = "",
}: Props) {
  const links: { label: string; href: string; tone?: "hedera" | "arkiv" }[] = [];

  if (hederaTxHash) {
    links.push({ label: "HashScan tx", href: hashscanTx(hederaTxHash), tone: "hedera" });
  }
  if (arkivTxHash) {
    links.push({ label: "Arkiv tx", href: arkivTx(arkivTxHash), tone: "arkiv" });
  }
  if (arkivEntityKey) {
    links.push({ label: "Arkiv entity", href: arkivEntity(arkivEntityKey), tone: "arkiv" });
  }
  if (showContracts) {
    if (AIRSPACE_CONTRACTS.title) {
      links.push({
        label: "Title contract",
        href: hashscanContract(AIRSPACE_CONTRACTS.title),
        tone: "hedera",
      });
    }
    if (AIRSPACE_CONTRACTS.market) {
      links.push({
        label: "Market contract",
        href: hashscanContract(AIRSPACE_CONTRACTS.market),
        tone: "hedera",
      });
    }
    links.push({ label: "Arkiv explorer", href: ARKIV_EXPLORER, tone: "arkiv" });
  }

  if (!links.length) return null;

  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-xs ${className}`}>
      {links.map((l) => (
        <a
          key={`${l.label}-${l.href}`}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className={l.tone === "arkiv" ? "text-arkiv underline" : "text-primary underline"}
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
