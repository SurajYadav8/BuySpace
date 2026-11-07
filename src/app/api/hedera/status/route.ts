import { NextResponse } from "next/server";
import { getAtsStatus } from "@/services/hedera/atsAirspaceService";
import { getArkivStatus } from "@/services/arkiv/arkivLeaseService";

export const dynamic = "force-dynamic";

export async function GET() {
  const [hedera, arkiv] = await Promise.all([getAtsStatus(), getArkivStatus()]);
  return NextResponse.json({ hedera, arkiv });
}
