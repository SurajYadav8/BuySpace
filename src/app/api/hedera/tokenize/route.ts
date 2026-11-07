import { NextRequest, NextResponse } from "next/server";
import { tokenizeAirspaceParcel } from "@/services/marketplaceService";
import { AirspaceParcel } from "@/types/airspace";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AirspaceParcel>;
    const required = [
      "title",
      "propertyAddress",
      "city",
      "currentHeight",
      "maximumHeight",
    ] as const;
    for (const key of required) {
      if (body[key] === undefined || body[key] === "") {
        return NextResponse.json({ error: `Missing field: ${key}` }, { status: 400 });
      }
    }

    const currentHeight = Number(body.currentHeight);
    const maximumHeight = Number(body.maximumHeight);
    if (maximumHeight <= currentHeight) {
      return NextResponse.json(
        { error: "maximumHeight must be greater than currentHeight (airspace envelope)" },
        { status: 400 }
      );
    }

    const parcel: AirspaceParcel = {
      title: String(body.title),
      description:
        body.description ||
        `Tokenized airspace rights above ${body.propertyAddress} from floor ${currentHeight} to ${maximumHeight}. Land and building are NOT included.`,
      propertyAddress: String(body.propertyAddress),
      city: String(body.city),
      currentHeight,
      maximumHeight,
      availableFloors: maximumHeight - currentHeight,
      latitude: Number(body.latitude ?? 19.076),
      longitude: Number(body.longitude ?? 72.8777),
      rightsType: (body.rightsType as AirspaceParcel["rightsType"]) || "view",
      numberOfShares: body.numberOfShares
        ? Number(body.numberOfShares)
        : maximumHeight - currentHeight,
      nominalValue: body.nominalValue || "1000",
    };

    const result = await tokenizeAirspaceParcel(parcel);
    return NextResponse.json({
      ok: true,
      title: result,
      concept:
        "ATS Equity = permanent title to the airspace parcel (vertical envelope). Not land. Not the building.",
    });
  } catch (err) {
    console.error("tokenize error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
