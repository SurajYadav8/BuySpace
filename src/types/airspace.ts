/** Airspace parcel — the RWA being tokenized (NOT land). */
export interface AirspaceParcel {
  title: string;
  description: string;
  propertyAddress: string;
  city: string;
  currentHeight: number;
  maximumHeight: number;
  availableFloors: number;
  latitude: number;
  longitude: number;
  /** view | development | temporary */
  rightsType: "view" | "development" | "temporary";
  /** Fractional units / shares representing the parcel (defaults to available floors). */
  numberOfShares?: number;
  nominalValue?: string;
}

export interface TokenizedAirspace {
  id: string;
  parcel: AirspaceParcel;
  /** On-chain title token id, or Hedera ATS Equity diamond (0.0.x) */
  titleTokenId: string;
  evmDiamondAddress?: string;
  ownerAccountId: string;
  ownerEvmAddress: string;
  transactionId: string;
  hashscanUrl: string;
  createdAt: string;
  paused?: boolean;
  lifecycleTxId?: string;
  /** Live demo: minted via connected wallet on AirspaceTitle */
  mintSource?: "onchain" | "ats";
}

export type LeaseStatus = "open" | "leased" | "cancelled";

export interface LeaseOfferInput {
  titleTokenId: string;
  propertyId: string;
  title: string;
  propertyAddress: string;
  city: string;
  price: string;
  leaseDays: number;
  currentHeight: number;
  maximumHeight: number;
  availableFloors: number;
  ownerEvmAddress?: string;
  /** On-chain market listing id from AirspaceLeaseMarket.createListing */
  listingId?: string;
  priceWei?: string;
  listingTxHash?: string;
}

export interface AirspaceLease {
  id: string;
  entityKey?: string;
  arkivTxHash?: string;
  expiresAtBlock?: string;
  status: LeaseStatus;
  titleTokenId: string;
  propertyId: string;
  title: string;
  propertyAddress: string;
  city: string;
  price: string;
  leaseDays: number;
  leaseStartIso?: string;
  leaseEndIso?: string;
  currentHeight: number;
  maximumHeight: number;
  availableFloors: number;
  ownerAccountId: string;
  ownerEvmAddress: string;
  lesseeAccountId?: string;
  lesseeEvmAddress?: string;
  leaseNftTokenId?: string;
  leaseNftSerial?: string;
  leaseNftTxId?: string;
  leaseNftHashscanUrl?: string;
  /** On-chain listing / lease certificate */
  listingId?: string;
  priceWei?: string;
  listingTxHash?: string;
  purchaseTxHash?: string;
  createdAt: string;
}

export interface PurchaseLeaseInput {
  leaseId: string;
  entityKey?: string;
  buyerAccountId?: string;
  buyerEvmAddress?: string;
  /** Live demo: buyer already paid + received lease NFT via connected wallet */
  mode?: "onchain" | "hts";
  listingId?: string;
  leaseTokenId?: string;
  purchaseTxHash?: string;
  expiresAt?: string;
}
