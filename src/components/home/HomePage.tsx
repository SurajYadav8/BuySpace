"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import IntegrationBadges from "@/components/brand/IntegrationBadges";
import DemoFlowGuide from "@/components/demo/DemoFlowGuide";
import FadeIn from "@/components/motion/FadeIn";
import AirRightPrices from "./AirRightPrices";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[440px] w-full items-center justify-center bg-[#E8ECF2] text-sm text-ink-muted md:h-[520px]">
      Loading Mumbai map...
    </div>
  ),
});

const RAILS = [
  {
    title: "Hedera title",
    body: "Mint a Title NFT for the vertical envelope. Land stays off-chain.",
  },
  {
    title: "Arkiv leases",
    body: "Offers expire with the term. Dead listings leave the marketplace alone.",
  },
  {
    title: "Buyer pays",
    body: "Buyers settle in HBAR from their wallet and receive a Lease NFT.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const motionOff = !ready || reduce;

  return (
    <>
      <section
        className="relative -mt-[4.75rem] flex min-h-[100svh] flex-col justify-center bg-bg pt-[4.75rem]"
        id="main-banner"
      >
        <div className="mx-auto w-full max-w-[1120px] px-5 py-8 md:px-6 md:py-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
            <div>
              <motion.div
                initial={motionOff ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <IntegrationBadges variant="wordmarks" label="Built with" />
              </motion.div>

              <motion.h1
                initial={motionOff ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: motionOff ? 0 : 0.04, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 font-display text-[2.35rem] font-extrabold leading-[1.05] tracking-[-0.04em] text-ink sm:text-4xl md:text-[3.1rem]"
              >
                Secure view rights above Mumbai.
              </motion.h1>

              <motion.p
                initial={motionOff ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: motionOff ? 0 : 0.08 }}
                className="mt-4 max-w-[34rem] text-[1rem] leading-relaxed text-ink-muted"
              >
                Tokenize air rights on Hedera, list time-bound leases on Arkiv, and let buyers pay
                from their own wallet. Title stays with the owner.
              </motion.p>

              <motion.div
                initial={motionOff ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: motionOff ? 0 : 0.12 }}
                className="mt-6 flex flex-wrap items-center gap-2.5"
              >
                <button
                  type="button"
                  onClick={() => router.push("/listings")}
                  className="rounded-full bg-ink px-5 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-[#152033]"
                >
                  Browse leases
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/tokenize")}
                  className="rounded-full border border-[rgba(10,15,26,0.12)] bg-white px-5 py-2.5 text-[0.88rem] font-semibold text-ink transition hover:border-[rgba(10,15,26,0.24)]"
                >
                  Tokenize on Hedera
                </button>
              </motion.div>
            </div>

            <motion.aside
              initial={motionOff ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: motionOff ? 0 : 0.1 }}
              className="rounded-[22px] border border-[rgba(10,15,26,0.08)] bg-white p-5 shadow-[0_16px_40px_rgba(10,15,26,0.06)] md:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-primary">
                  Network
                </p>
                <span className="rounded-full bg-bg px-2.5 py-1 text-[0.7rem] font-semibold text-ink-muted">
                  296
                </span>
              </div>
              <p className="mt-2 font-display text-xl font-bold tracking-tight text-ink">
                Hedera Testnet
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Titles, leases, and HBAR settlement. Expiry indexed on Arkiv.
              </p>
              <ul className="mt-5 space-y-3 border-t border-[rgba(10,15,26,0.08)] pt-4">
                {RAILS.map((rail) => (
                  <li key={rail.title}>
                    <p className="text-sm font-semibold text-ink">{rail.title}</p>
                    <p className="mt-0.5 text-[0.8rem] leading-snug text-ink-muted">{rail.body}</p>
                  </li>
                ))}
              </ul>
            </motion.aside>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-[1120px] px-5 md:mt-14 md:px-6">
        <div className="overflow-hidden rounded-[22px] border border-[rgba(10,15,26,0.1)] bg-[#0A0F1A] shadow-[0_24px_60px_rgba(10,15,26,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#7DDEA8]">
                Live map
              </p>
              <p className="text-sm font-semibold text-white">Jio World Centre corridor · BKC</p>
            </div>
            <Link
              href="/tokenize"
              className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-[#F3F5F8]"
            >
              Tokenize a parcel
            </Link>
          </div>
          <div className="bg-[#111827]">
            <MapComponent fill={false} />
          </div>
        </div>
      </section>

      <div className="mt-8">
        <AirRightPrices />
      </div>

      <section className="mx-auto max-w-[1120px] px-5 py-14 md:px-6 md:py-16">
        <FadeIn>
          <DemoFlowGuide />
        </FadeIn>
      </section>

      <section className="border-t border-[rgba(10,15,26,0.08)] bg-white">
        <div className="mx-auto grid max-w-[1120px] items-start gap-10 px-5 py-14 md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:px-6 md:py-16">
          <FadeIn>
            <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-primary">
              Why BuySpace
            </p>
            <h2 className="font-display text-[1.85rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink md:text-[2.35rem]">
              Settlement on Hedera.
              <span className="mt-1 block text-ink-muted">Expiry on Arkiv.</span>
            </h2>
            <p className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-ink-muted">
              Wallets, HBAR, and NFT certificates live on Hedera. Lease offers index on Arkiv with
              automatic expiry so the marketplace stays honest.
            </p>
          </FadeIn>

          <div className="overflow-hidden rounded-[22px] border border-[rgba(10,15,26,0.08)] bg-[#F7F8FB]">
            <FadeIn delay={0.06}>
              <div className="flex gap-4 border-b border-[rgba(10,15,26,0.08)] px-5 py-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/hedera-mark.svg" alt="" width={22} height={22} className="mt-0.5" />
                <div>
                  <p className="font-semibold text-ink">Hedera Testnet</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                    Title mint, lease listing, and purchase txs you can verify on HashScan.
                  </p>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="flex gap-4 px-5 py-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/arkiv-mark.svg" alt="" width={28} height={16} className="mt-1" />
                <div>
                  <p className="font-semibold text-ink">Arkiv Rabdi</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                    Expiring lease entities for discovery, with explorer links after each list and
                    buy.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
