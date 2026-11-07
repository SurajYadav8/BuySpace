import { NextRequest, NextResponse } from "next/server";
import { purchaseLease } from "@/services/marketplaceService";
import { HEDERA_CONFIG } from "@/config/chains";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.leaseId) {
      return NextResponse.json({ error: "leaseId required" }, { status: 400 });
    }

    const result = await purchaseLease({
      leaseId: body.leaseId,
      entityKey: body.entityKey,
      mode: body.mode || (body.purchaseTxHash ? "onchain" : "hts"),
      buyerAccountId: body.buyerAccountId || HEDERA_CONFIG.buyerAccountId,
      buyerEvmAddress: body.buyerEvmAddress,
      listingId: body.listingId,
      leaseTokenId: body.leaseTokenId,
      purchaseTxHash: body.purchaseTxHash,
      expiresAt: body.expiresAt,
    });

    return NextResponse.json({
      ok: true,
      ...result,
      concept: {
        title: "BuySpace title stays with owner (not land)",
        leaseNft: "Buyer received lease certificate via their connected Hedera wallet",
        arkiv: "Entity expires at lease end  -  marketplace drops it automatically",
      },
    });
  } catch (err) {
    console.error("purchase error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
