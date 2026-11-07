"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Logo from "./Logo";

const NAV = [
  { href: "/tokenize", label: "Tokenize" },
  { href: "/lease/create", label: "Create lease" },
  { href: "/listings", label: "Marketplace" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-nfts", label: "My NFTs" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="pointer-events-auto mx-3 mt-3 max-w-[1200px] md:mx-auto md:mt-[0.85rem] md:px-3">
        <div className="flex h-[54px] items-center justify-between rounded-full border border-[rgba(10,15,26,0.1)] bg-white/90 px-4 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_14px_36px_rgba(10,15,26,0.1)] backdrop-blur-[18px] backdrop-saturate-150 md:px-5">
          <Logo />

          <nav className="hidden items-center gap-x-5 lg:flex">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[0.9rem] font-semibold transition ${
                    active ? "text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="buyspace-connect flex items-center">
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="address"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
