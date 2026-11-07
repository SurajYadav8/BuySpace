import {
  createPublicClient,
  createWalletClient,
  ExpirationTime,
} from "@arkiv-network/sdk";
import { addr, dec, i32 } from "@arkiv-network/sdk/schema";
import { eq } from "@arkiv-network/sdk/query";
import { rabdi } from "@arkiv-network/sdk/chains";
import { http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARKIV_CONFIG, requireArkivEnv } from "@/config/chains";
import { AirspaceLeases } from "./leaseSchema";
import { LeaseOfferInput, AirspaceLease } from "@/types/airspace";
import { HEDERA_CONFIG } from "@/config/chains";
import { saveLease, updateLease, listLeases, getLease } from "@/services/store/airspaceStore";
import { randomUUID } from "crypto";

function getChain() {
  requireArkivEnv();
  return rabdi({ accessKey: ARKIV_CONFIG.accessKey });
}

function getAccount() {
  requireArkivEnv();
  const key = ARKIV_CONFIG.privateKey.startsWith("0x")
    ? (ARKIV_CONFIG.privateKey as Hex)
    : (`0x${ARKIV_CONFIG.privateKey}` as Hex);
  return privateKeyToAccount(key);
}

export function getArkivWalletClient() {
  const chain = getChain();
  const account = getAccount();
  return {
    account,
    client: createWalletClient({
      account,
      chain,
      transport: http(),
    }),
  };
}

export function getArkivPublicClient() {
  const chain = getChain();
  return createPublicClient({
    chain,
    transport: http(),
  });
}

export async function createLeaseOffer(input: LeaseOfferInput): Promise<AirspaceLease> {
  const { account, client } = getArkivWalletClient();
  const ownerAddr = (input.ownerEvmAddress || HEDERA_CONFIG.evmAddress || account.address) as `0x${string}`;

  const { entityKey, txHash, expiresAt } = await client.createEntity(
    AirspaceLeases,
    {
      owner: addr(ownerAddr),
      status: "open",
      propertyId: input.propertyId,
      titleTokenId: input.titleTokenId,
      price: dec(input.price),
      city: input.city,
      leaseDays: i32(input.leaseDays),
      title: input.title,
      propertyAddress: input.propertyAddress,
      currentHeight: i32(input.currentHeight),
      maximumHeight: i32(input.maximumHeight),
      availableFloors: i32(input.availableFloors),
    },
    {
      // Offer stays queryable until lease term would end (max ~182 days on Arkiv)
      expiration: ExpirationTime.fromDays(Math.min(Math.max(input.leaseDays, 1), 180)),
    }
  );

  const lease: AirspaceLease = {
    id: randomUUID(),
    entityKey,
    arkivTxHash: txHash,
    expiresAtBlock: expiresAt?.toString(),
    status: "open",
    titleTokenId: input.titleTokenId,
    propertyId: input.propertyId,
    title: input.title,
    propertyAddress: input.propertyAddress,
    city: input.city,
    price: input.price,
    leaseDays: input.leaseDays,
    currentHeight: input.currentHeight,
    maximumHeight: input.maximumHeight,
    availableFloors: input.availableFloors,
    ownerAccountId: input.ownerEvmAddress || HEDERA_CONFIG.accountId || ownerAddr,
    ownerEvmAddress: ownerAddr,
    listingId: input.listingId,
    priceWei: input.priceWei,
    listingTxHash: input.listingTxHash,
    createdAt: new Date().toISOString(),
  };

  return saveLease(lease);
}

export async function activateLeaseOnArkiv(params: {
  leaseId: string;
  lesseeEvmAddress: string;
  leaseNftSerial: string;
  leaseStartIso: string;
  leaseEndIso: string;
  leaseDays: number;
}) {
  const lease = getLease(params.leaseId);
  if (!lease?.entityKey) {
    throw new Error("Lease has no Arkiv entity key");
  }

  const { client } = getArkivWalletClient();
  const lessee = params.lesseeEvmAddress as `0x${string}`;

  // Patch status + lessee + dates; extend expiration to exact lease end
  await client.patchEntity(AirspaceLeases, lease.entityKey as Hex, {
    set: {
      lessee: addr(lessee),
      status: "leased",
      leaseNftSerial: params.leaseNftSerial,
      leaseStartIso: params.leaseStartIso,
      leaseEndIso: params.leaseEndIso,
    },
  });

  const end = new Date(params.leaseEndIso);
  await client.extendEntity({
    entityKey: lease.entityKey as Hex,
    expiration: ExpirationTime.atDate(end, {
      atLeast: ExpirationTime.fromDays(1),
    }),
  });

  return updateLease(params.leaseId, {
    status: "leased",
    lesseeEvmAddress: lessee,
    leaseNftSerial: params.leaseNftSerial,
    leaseStartIso: params.leaseStartIso,
    leaseEndIso: params.leaseEndIso,
  });
}

export async function listActiveLeasesFromArkiv() {
  try {
    const publicClient = getArkivPublicClient();
    const { entities } = await publicClient
      .select({
        $key: true,
        $owner: true,
        $expiresAt: true,
        owner: true,
        lessee: true,
        status: true,
        propertyId: true,
        titleTokenId: true,
        leaseNftSerial: true,
        price: true,
        city: true,
        leaseDays: true,
        title: true,
        propertyAddress: true,
        leaseStartIso: true,
        leaseEndIso: true,
        currentHeight: true,
        maximumHeight: true,
        availableFloors: true,
      })
      .from(AirspaceLeases)
      .where(eq("status", "open"))
      .fetch();

    const fromArkiv = entities.map((row) => ({
      entityKey: row.$key,
      ownerEvmAddress: row.owner?.value,
      lesseeEvmAddress: row.lessee?.value,
      status: row.status?.value as string,
      propertyId: row.propertyId?.value as string,
      titleTokenId: row.titleTokenId?.value as string,
      leaseNftSerial: row.leaseNftSerial?.value as string | undefined,
      price: String(row.price?.value ?? ""),
      city: row.city?.value as string,
      leaseDays: Number(row.leaseDays?.value ?? 0),
      title: row.title?.value as string,
      propertyAddress: row.propertyAddress?.value as string,
      leaseStartIso: row.leaseStartIso?.value as string | undefined,
      leaseEndIso: row.leaseEndIso?.value as string | undefined,
      currentHeight: Number(row.currentHeight?.value ?? 0),
      maximumHeight: Number(row.maximumHeight?.value ?? 0),
      availableFloors: Number(row.availableFloors?.value ?? 0),
      expiresAtBlock: row.$expiresAt?.toString(),
      source: "arkiv" as const,
    }));

    // Merge with local store for open leases (ids / hashscan links)
    const local = listLeases().filter((l) => l.status === "open" || l.status === "leased");
    return { fromArkiv, local, query: `status = str('open') on schema airspace.mumbai.leases` };
  } catch (err) {
    // Fall back to local store so UI still works while Arkiv keys are missing
    const local = listLeases().filter((l) => l.status === "open");
    return {
      fromArkiv: [],
      local,
      error: err instanceof Error ? err.message : String(err),
      query: `status = str('open') on schema airspace.mumbai.leases`,
    };
  }
}

export async function getArkivStatus() {
  try {
    requireArkivEnv();
    const account = getAccount();
    return {
      configured: true,
      chainId: ARKIV_CONFIG.chainId,
      writerAddress: account.address,
      explorer: ARKIV_CONFIG.explorer,
      sampleQuery: "select * from airspace.mumbai.leases where status = 'open'",
    };
  } catch (e) {
    return {
      configured: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
