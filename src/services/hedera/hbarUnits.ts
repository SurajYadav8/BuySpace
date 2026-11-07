"use client";

import { parseEther, formatEther } from "ethers";

/**
 * Hedera payment model (handled in AirspaceLeaseMarket.sol):
 * - Store / display prices as 18-decimal wei via parseEther("1") = 1 HBAR
 * - Wallet sends the same wei amount as tx.value
 * - Contract scales msg.value (tinybars) * 1e10 before comparing
 */
export function hbarToWei(hbar: string | number): bigint {
  return parseEther(String(hbar));
}

export function formatHbarFromWei(wei: bigint): string {
  return formatEther(wei);
}
