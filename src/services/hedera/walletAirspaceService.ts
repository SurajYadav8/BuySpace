"use client";

import { Contract, JsonRpcSigner, EventLog } from "ethers";
import type { Hex } from "viem";
import TitleAbi from "@/abis/AirspaceTitle.json";
import MarketAbi from "@/abis/AirspaceLeaseMarket.json";
import { AIRSPACE_CONTRACTS, contractsConfigured } from "@/config/contracts";
import {
  HEDERA_TX_GAS,
  HEDERA_PURCHASE_GAS,
  shortAirspaceUri,
  writeContractViaEip1193,
} from "@/services/hedera/hederaTx";
import { hbarToWei, formatHbarFromWei } from "@/services/hedera/hbarUnits";
import type { Eip1193Provider } from "@/context/HederaWalletContext";

function requireContracts() {
  if (!contractsConfigured()) {
    throw new Error(
      "Deploy AirspaceTitle + AirspaceLeaseMarket and set NEXT_PUBLIC_AIRSPACE_* addresses"
    );
  }
}

function parseListingId(contract: Contract, logs: readonly any[]) {
  for (const log of logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "ListingCreated") return parsed.args.listingId.toString();
    } catch {
      /* skip */
    }
  }
  return "";
}

function parseMintId(contract: Contract, logs: readonly any[]) {
  for (const log of logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "AirspaceMinted") return parsed.args.tokenId.toString();
    } catch {
      /* skip */
    }
  }
  return "";
}

function parsePurchase(contract: Contract, logs: readonly any[]) {
  for (const log of logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "LeasePurchased") {
        return {
          leaseTokenId: parsed.args.leaseTokenId.toString(),
          expiresAt: parsed.args.expiresAt.toString(),
        };
      }
    } catch {
      /* skip */
    }
  }
  return { leaseTokenId: "", expiresAt: "" };
}

type SendOpts = {
  signer: JsonRpcSigner;
  eip1193: Eip1193Provider;
  from: string;
  chainId?: number | null;
  address: string;
  abi: any[];
  functionName: string;
  args: readonly unknown[];
  value?: bigint;
  gas?: bigint;
};

async function sendContractCall(opts: SendOpts) {
  if (!opts.eip1193?.request) {
    throw new Error("Wallet provider missing — reconnect HashPack / MetaMask");
  }
  return writeContractViaEip1193({
    eip1193: opts.eip1193,
    from: opts.from,
    address: opts.address,
    abi: opts.abi,
    functionName: opts.functionName,
    args: opts.args,
    value: opts.value,
    gas: opts.gas,
    chainId: opts.chainId,
  });
}

export async function mintAirspaceTitle(
  signer: JsonRpcSigner,
  input: {
    propertyAddress: string;
    currentHeight: number;
    maximumHeight: number;
    metadataUri?: string;
  },
  eip1193: Eip1193Provider,
  chainId?: number | null
) {
  requireContracts();
  const from = await signer.getAddress();
  const contract = new Contract(AIRSPACE_CONTRACTS.title, TitleAbi, signer);
  const uri =
    input.metadataUri ||
    shortAirspaceUri({
      n: "Title",
      a: input.propertyAddress.slice(0, 32),
      h: [input.currentHeight, input.maximumHeight],
    });

  const receipt = await sendContractCall({
    signer,
    eip1193,
    from,
    chainId,
    address: AIRSPACE_CONTRACTS.title,
    abi: TitleAbi as any[],
    functionName: "mint",
    args: [
      input.propertyAddress,
      BigInt(input.currentHeight),
      BigInt(input.maximumHeight),
      uri,
    ],
    gas: HEDERA_TX_GAS,
  });

  let tokenId = parseMintId(contract, receipt.logs);
  if (!tokenId) {
    try {
      tokenId = (BigInt(await contract.nextId()) - BigInt(1)).toString();
    } catch {
      tokenId = "1";
    }
  }
  return { tokenId, txHash: receipt.hash, owner: from };
}

export async function createOnChainListing(
  signer: JsonRpcSigner,
  input: {
    titleTokenId: string | number;
    priceHbar: string;
    leaseDays: number;
    metadataUri?: string;
  },
  eip1193: Eip1193Provider,
  chainId?: number | null
) {
  requireContracts();
  if (input.titleTokenId === "" || input.titleTokenId === undefined || input.titleTokenId === null) {
    throw new Error("Select a title token id first (tokenize, then list)");
  }
  const from = await signer.getAddress();
  const contract = new Contract(AIRSPACE_CONTRACTS.market, MarketAbi, signer);
  const priceWei = hbarToWei(String(input.priceHbar || "1"));
  const leaseDays = Number(input.leaseDays);
  if (!Number.isFinite(leaseDays) || leaseDays < 1 || leaseDays > 3650) {
    throw new Error("Lease days must be between 1 and 3650");
  }
  const titleTokenId = BigInt(input.titleTokenId);
  const uri = shortAirspaceUri({
    id: String(input.titleTokenId),
    d: leaseDays,
    p: String(input.priceHbar),
  });

  const receipt = await sendContractCall({
    signer,
    eip1193,
    from,
    chainId,
    address: AIRSPACE_CONTRACTS.market,
    abi: MarketAbi as any[],
    functionName: "createListing",
    args: [titleTokenId, priceWei, BigInt(leaseDays), uri],
    gas: HEDERA_TX_GAS,
  });

  let listingId = parseListingId(contract, receipt.logs);
  if (!listingId) {
    try {
      listingId = (BigInt(await contract.nextListingId()) - BigInt(1)).toString();
    } catch {
      listingId = "1";
    }
  }

  return {
    listingId,
    priceWei: priceWei.toString(),
    priceHbar: formatHbarFromWei(priceWei),
    txHash: receipt.hash,
    seller: from,
  };
}

export async function purchaseOnChainListing(
  signer: JsonRpcSigner,
  listingId: string | number,
  eip1193: Eip1193Provider,
  chainId?: number | null
) {
  requireContracts();
  const from = await signer.getAddress();
  const contract = new Contract(AIRSPACE_CONTRACTS.market, MarketAbi, signer);
  const listing = await contract.listings(BigInt(listingId));
  if (!listing.active) {
    throw new Error(`Listing #${listingId} is not active`);
  }
  const priceWei = BigInt(listing.priceWei);
  if (priceWei <= BigInt(0)) throw new Error("Invalid listing price");

  const receipt = await sendContractCall({
    signer,
    eip1193,
    from,
    chainId,
    address: AIRSPACE_CONTRACTS.market,
    abi: MarketAbi as any[],
    functionName: "purchase",
    args: [BigInt(listingId)],
    value: priceWei,
    gas: HEDERA_PURCHASE_GAS,
  });

  const bought = parsePurchase(contract, receipt.logs as EventLog[]);
  return {
    ...bought,
    txHash: receipt.hash,
    buyer: from,
    paidRpcWei: priceWei.toString(),
  };
}

export { AIRSPACE_CONTRACTS, contractsConfigured };
export type { Hex };
