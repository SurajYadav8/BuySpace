import { NextRequest, NextResponse } from "next/server";
import { listAirspaceTitle, marketplaceListings } from "@/services/marketplaceService";
import { listLeases } from "@/services/store/airspaceStore";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  try {
    const listings = await marketplaceListings();
    return NextResponse.json({
      ...listings,
      allLocal: listLeases(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err), allLocal: listLeases() },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lease = await listAirspaceTitle({
      titleTokenId: body.titleTokenId,
      propertyId: body.propertyId || body.titleTokenId,
      title: body.title,
      propertyAddress: body.propertyAddress,
      city: body.city || "Mumbai",
      price: String(body.price ?? "1000"),
      leaseDays: Number(body.leaseDays ?? 365),
      currentHeight: Number(body.currentHeight ?? 0),
      maximumHeight: Number(body.maximumHeight ?? 1),
      availableFloors: Number(body.availableFloors ?? 1),
      ownerEvmAddress: body.ownerEvmAddress,
      listingId: body.listingId ? String(body.listingId) : undefined,
      priceWei: body.priceWei ? String(body.priceWei) : undefined,
      listingTxHash: body.listingTxHash,
    });
    return NextResponse.json({
      ok: true,
      lease,
      note: "Arkiv entity expires with the lease term. Marketplace reads Arkiv; expired leases disappear.",
    });
  } catch (err) {
    console.error("create lease error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
