import { NextRequest, NextResponse } from "next/server";
import { endLeaseDemo } from "@/services/marketplaceService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { leaseId } = await req.json();
    if (!leaseId) {
      return NextResponse.json({ error: "leaseId required" }, { status: 400 });
    }
    const result = await endLeaseDemo(leaseId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
