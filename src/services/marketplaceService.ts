import { tokenizeAirspace } from "@/services/hedera/atsAirspaceService";
import { mintLeaseNftToBuyer, burnLeaseNft } from "@/services/hedera/leaseNftService";
import {
  createLeaseOffer,
  activateLeaseOnArkiv,
  listActiveLeasesFromArkiv,
} from "@/services/arkiv/arkivLeaseService";
import { AirspaceParcel, LeaseOfferInput, PurchaseLeaseInput } from "@/types/airspace";
import { getLease, listTitles, updateLease } from "@/services/store/airspaceStore";
import { HEDERA_CONFIG } from "@/config/chains";

export async function tokenizeAirspaceParcel(parcel: AirspaceParcel) {
  return tokenizeAirspace(parcel);
}

export async function listAirspaceTitle(input: LeaseOfferInput) {
  const title = listTitles().find(
    (t) => t.titleTokenId === input.titleTokenId || t.id === input.titleTokenId
  );
  if (!title && !input.titleTokenId) {
    throw new Error("Tokenize the airspace on Hedera ATS before creating a lease offer");
  }
  return createLeaseOffer({
    ...input,
    titleTokenId: input.titleTokenId || title!.titleTokenId,
    propertyId: input.propertyId || title?.id || input.titleTokenId,
  });
}

/**
 * Live demo purchase (preferred):
 * Buyer already paid + received lease NFT via connected wallet on AirspaceLeaseMarket.
 * Server only records + activates Arkiv — no operator private key minting.
 *
 * Legacy HTS path still available with mode: "hts" if needed.
 */
export async function purchaseLease(input: PurchaseLeaseInput) {
  const lease = getLease(input.leaseId);
  if (!lease) throw new Error(`Lease not found: ${input.leaseId}`);
  if (lease.status === "leased") throw new Error("Lease already taken");

  const leaseStart = new Date();
  const leaseEnd = input.expiresAt
    ? new Date(Number(input.expiresAt) * 1000)
    : new Date(leaseStart.getTime() + lease.leaseDays * 24 * 60 * 60 * 1000);
  const leaseStartIso = leaseStart.toISOString();
  const leaseEndIso = leaseEnd.toISOString();
  const buyerEvm = input.buyerEvmAddress || "";

  if (input.mode === "onchain" || input.purchaseTxHash) {
    if (!buyerEvm || !input.purchaseTxHash) {
      throw new Error("onchain purchase requires buyerEvmAddress and purchaseTxHash");
    }
    const hashscanBase = process.env.NEXT_PUBLIC_HASHSCAN_BASE || "https://hashscan.io/testnet";
    const nft = {
      tokenId: input.leaseTokenId || "onchain-lease",
      serial: input.leaseTokenId || "1",
      transactionId: input.purchaseTxHash,
      hashscanNftUrl: `${hashscanBase}/transaction/${input.purchaseTxHash}`,
    };

    let activated;
    try {
      activated = await activateLeaseOnArkiv({
        leaseId: lease.id,
        lesseeEvmAddress: buyerEvm,
        leaseNftSerial: nft.serial,
        leaseStartIso,
        leaseEndIso,
        leaseDays: lease.leaseDays,
      });
    } catch (err) {
      activated = updateLease(lease.id, {
        status: "leased",
        lesseeAccountId: buyerEvm,
        lesseeEvmAddress: buyerEvm,
        leaseNftTokenId: nft.tokenId,
        leaseNftSerial: nft.serial,
        leaseNftTxId: nft.transactionId,
        leaseNftHashscanUrl: nft.hashscanNftUrl,
        purchaseTxHash: input.purchaseTxHash,
        listingId: input.listingId || lease.listingId,
        leaseStartIso,
        leaseEndIso,
      });
      return {
        lease: activated,
        nft,
        arkivError: err instanceof Error ? err.message : String(err),
        note: "On-chain lease purchased with your wallet. Arkiv activation failed — check ARKIV_* env.",
      };
    }

    const finalLease = updateLease(lease.id, {
      lesseeAccountId: buyerEvm,
      lesseeEvmAddress: buyerEvm,
      leaseNftTokenId: nft.tokenId,
      leaseNftSerial: nft.serial,
      leaseNftTxId: nft.transactionId,
      leaseNftHashscanUrl: nft.hashscanNftUrl,
      purchaseTxHash: input.purchaseTxHash,
      listingId: input.listingId || lease.listingId,
      status: "leased",
      leaseStartIso,
      leaseEndIso,
    });

    return {
      lease: finalLease,
      nft,
      note: "Title stays with owner. Buyer received on-chain Lease NFT via connected wallet. Arkiv expires at term end.",
    };
  }

  const buyerAccountId =
    input.buyerAccountId || HEDERA_CONFIG.buyerAccountId || HEDERA_CONFIG.accountId;
  if (!buyerAccountId) {
    throw new Error("No buyer account — connect a Hedera wallet (onchain mode) or set HEDERA_BUYER_ACCOUNT_ID");
  }

  const nft = await mintLeaseNftToBuyer({
    buyerAccountId,
    metadata: {
      title: lease.title,
      propertyAddress: lease.propertyAddress,
      titleTokenId: lease.titleTokenId,
      leaseStartIso,
      leaseEndIso,
      currentHeight: lease.currentHeight,
      maximumHeight: lease.maximumHeight,
      availableFloors: lease.availableFloors,
      arkivEntityKey: lease.entityKey,
    },
    buyerPrivateKey: HEDERA_CONFIG.buyerPrivateKey || undefined,
  });

  let activated;
  try {
    activated = await activateLeaseOnArkiv({
      leaseId: lease.id,
      lesseeEvmAddress: buyerEvm || HEDERA_CONFIG.evmAddress,
      leaseNftSerial: nft.serial,
      leaseStartIso,
      leaseEndIso,
      leaseDays: lease.leaseDays,
    });
  } catch (err) {
    activated = updateLease(lease.id, {
      status: "leased",
      lesseeAccountId: buyerAccountId,
      lesseeEvmAddress: buyerEvm || HEDERA_CONFIG.evmAddress,
      leaseNftTokenId: nft.tokenId,
      leaseNftSerial: nft.serial,
      leaseNftTxId: nft.transactionId,
      leaseNftHashscanUrl: nft.hashscanNftUrl,
      leaseStartIso,
      leaseEndIso,
    });
    return {
      lease: activated,
      nft,
      arkivError: err instanceof Error ? err.message : String(err),
      note: "Lease NFT minted on Hedera. Arkiv activation failed — check ARKIV_* env.",
    };
  }

  const finalLease = updateLease(lease.id, {
    lesseeAccountId: buyerAccountId,
    leaseNftTokenId: nft.tokenId,
    leaseNftSerial: nft.serial,
    leaseNftTxId: nft.transactionId,
    leaseNftHashscanUrl: nft.hashscanNftUrl,
    status: "leased",
    leaseStartIso,
    leaseEndIso,
  });

  return {
    lease: finalLease,
    nft,
    note: "Title remains with owner. Buyer received Lease NFT for the term. Arkiv entity expires at lease end.",
  };
}

export async function endLeaseDemo(leaseId: string) {
  const lease = getLease(leaseId);
  if (!lease?.leaseNftTokenId || !lease.leaseNftSerial) {
    throw new Error("Lease has no Lease NFT to burn");
  }
  let burn;
  try {
    burn = await burnLeaseNft(lease.leaseNftTokenId, lease.leaseNftSerial);
  } catch (err) {
    burn = { error: err instanceof Error ? err.message : String(err) };
  }
  const updated = updateLease(leaseId, { status: "cancelled" });
  return { lease: updated, burn };
}

export async function marketplaceListings() {
  return listActiveLeasesFromArkiv();
}
