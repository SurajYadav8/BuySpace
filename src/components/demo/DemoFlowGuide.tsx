"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Tokenize",
    body: "Owner mints a Title NFT for a parcel on Hedera.",
    href: "/tokenize",
  },
  {
    n: "02",
    title: "List lease",
    body: "Owner creates an on-chain listing. Arkiv indexes the offer.",
    href: "/lease/create",
  },
  {
    n: "03",
    title: "Buy",
    body: "Buyer pays HBAR and receives a Lease NFT. Title stays with the owner.",
    href: "/listings",
  },
];

export default function DemoFlowGuide({ compact = false }: { compact?: boolean }) {
  const reduce = useReducedMotion();

  return (
    <div className={compact ? "mb-6" : ""}>
      {!compact && (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-primary">
              Demo flow
            </p>
            <h2 className="font-display text-[1.85rem] font-extrabold tracking-[-0.03em] text-ink md:text-[2.2rem]">
              Three steps on Hedera
            </h2>
          </div>
        </div>
      )}
      <ol className="grid overflow-hidden rounded-[22px] border border-[rgba(10,15,26,0.08)] bg-white md:grid-cols-3">
        {STEPS.map((step, i) => (
          <motion.li
            key={step.n}
            className={`px-5 py-6 md:px-6 ${
              i > 0 ? "border-t border-[rgba(10,15,26,0.08)] md:border-t-0 md:border-l" : ""
            }`}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.4, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              {step.n}
            </p>
            <p className="mt-2 font-display text-xl font-bold text-ink">{step.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{step.body}</p>
            <Link
              href={step.href}
              className="mt-4 inline-flex text-sm font-semibold text-primary transition hover:text-ink"
            >
              Open →
            </Link>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
