import { NextRequest, NextResponse } from "next/server";
import { saveTitle } from "@/services/store/airspaceStore";
import { AirspaceParcel, TokenizedAirspace } from "@/types/airspace";
import { randomUUID } from "crypto";

/**
 * Record a title that was minted on-chain by the owner's connected wallet.
 * No private key / operator signing  -  client already signed mint().
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tokenId,
      txHash,
      ownerEvmAddress,
      parcel,
    }: {
      tokenId: string;
      txHash: string;
      ownerEvmAddress: string;
      parcel: AirspaceParcel;
    } = body;

    if (!tokenId || !txHash || !ownerEvmAddress || !parcel?.propertyAddress) {
      return NextResponse.json(
        { error: "tokenId, txHash, ownerEvmAddress, and parcel are required" },
        { status: 400 }
      );
    }

    const hashscanBase = process.env.NEXT_PUBLIC_HASHSCAN_BASE || "https://hashscan.io/testnet";
    const title: TokenizedAirspace = {
      id: randomUUID(),
      parcel,
      titleTokenId: String(tokenId),
      ownerAccountId: ownerEvmAddress,
      ownerEvmAddress,
      transactionId: txHash,
      hashscanUrl: `${hashscanBase}/transaction/${txHash}`,
      createdAt: new Date().toISOString(),
      mintSource: "onchain",
    };

    saveTitle(title);
    return NextResponse.json({
      title,
      concept:
        "BuySpace TITLE NFT minted to your connected Hedera wallet. Land stays off-chain; this is the empty volume above the property.",
    });
  } catch (err) {
    console.error("record-title", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
