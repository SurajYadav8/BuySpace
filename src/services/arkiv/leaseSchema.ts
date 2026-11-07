import { addr, dec, defineSchema, i32, str } from "@arkiv-network/sdk/schema";

/**
 * Time-bound airspace lease offers / active leases.
 * Entity expiration = lease end → Arkiv drops it from queries automatically.
 */
export const AirspaceLeases = defineSchema("airspace.mumbai.leases", {
  owner: addr().indexed(),
  lessee: addr().indexed().optional(),
  status: str().indexed(), // open | leased | cancelled
  propertyId: str().indexed(),
  titleTokenId: str().indexed(),
  leaseNftSerial: str().indexed().optional(),
  price: dec().indexed(),
  city: str().indexed(),
  leaseDays: i32().indexed(),
  title: str(),
  propertyAddress: str(),
  leaseStartIso: str().optional(),
  leaseEndIso: str().optional(),
  currentHeight: i32(),
  maximumHeight: i32(),
  availableFloors: i32(),
});
