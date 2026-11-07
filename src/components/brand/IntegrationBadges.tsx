"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type Props = {
  className?: string;
  label?: string;
  variant?: "icons" | "wordmarks";
};

export default function IntegrationBadges({
  className = "",
  label = "Built with",
  variant = "icons",
}: Props) {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const motionOff = !ready || reduce;

  const items =
    variant === "wordmarks"
      ? [
          {
            src: "/brand/hedera-light.svg",
            alt: "Hedera",
            w: 96,
            h: 28,
            href: "https://hedera.com",
          },
          {
            src: "/brand/arkiv-black.svg",
            alt: "Arkiv",
            w: 84,
            h: 20,
            href: "https://arkiv.network",
          },
        ]
      : [
          {
            src: "/brand/hedera-mark.svg",
            alt: "Hedera",
            w: 18,
            h: 18,
            href: "https://hedera.com",
            caption: "Hedera",
          },
          {
            src: "/brand/arkiv-mark.svg",
            alt: "Arkiv",
            w: 24,
            h: 14,
            href: "https://arkiv.network",
            caption: "Arkiv",
          },
        ];

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      {label ? (
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
          {label}
        </span>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 md:gap-5">
        {items.map((item, i) => (
          <motion.a
            key={item.alt}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            initial={motionOff ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: motionOff ? 0 : 0.06 * i }}
            className="inline-flex items-center gap-2 opacity-80 transition hover:opacity-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={item.alt}
              width={item.w}
              height={item.h}
              className="object-contain"
            />
            {"caption" in item && item.caption ? (
              <span className="text-sm font-medium text-ink">{item.caption}</span>
            ) : null}
          </motion.a>
        ))}
      </div>
    </div>
  );
}
