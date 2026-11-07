import { NextResponse } from "next/server";
import { listTitles } from "@/services/store/airspaceStore";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ titles: listTitles() });
}
