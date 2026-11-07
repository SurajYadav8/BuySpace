/**
 * HTS Lease NFT  -  minted TO the buyer on purchase of a time-bound airspace lease.
 * Title (ATS Equity) stays with the owner; this NFT is the buyer's on-chain certificate.
 */
import {
  AccountId,
  NftId,
  Status,
  TokenAssociateTransaction,
  TokenBurnTransaction,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenNftInfoQuery,
  TokenSupplyType,
  TokenType,
  TransferTransaction,
} from "@hashgraph/sdk";
import { HEDERA_CONFIG, hashscanTokenUrl, hashscanTxUrl } from "@/config/chains";
import { getHederaClient, parseHederaPrivateKey } from "./hederaClient";
import {
  getLeaseNftCollectionId,
  setLeaseNftCollectionId,
} from "@/services/store/airspaceStore";

export interface LeaseNftMetadata {
  title: string;
  propertyAddress: string;
  titleTokenId: string;
  leaseStartIso: string;
  leaseEndIso: string;
  currentHeight: number;
  maximumHeight: number;
  availableFloors: number;
  arkivEntityKey?: string;
}

async function ensureLeaseCollection(): Promise<string> {
  const existing = HEDERA_CONFIG.leaseNftTokenId || getLeaseNftCollectionId();
  if (existing) return existing;

  const { client, operatorId, operatorKey } = getHederaClient();

  const tx = await new TokenCreateTransaction()
    .setTokenName("BuySpace Lease Certificate")
    .setTokenSymbol("AIRLEASE")
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setMaxSupply(100000)
    .setSupplyType(TokenSupplyType.Finite)
    .setTreasuryAccountId(operatorId)
    .setSupplyKey(operatorKey)
    .setAdminKey(operatorKey)
    .setFreezeDefault(false)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  if (receipt.status !== Status.Success || !receipt.tokenId) {
    throw new Error(`Failed to create Lease NFT collection: ${receipt.status}`);
  }

  const tokenId = receipt.tokenId.toString();
  setLeaseNftCollectionId(tokenId);
  return tokenId;
}

async function associateIfNeeded(tokenId: string, accountId: string, privateKey?: string) {
  if (accountId === HEDERA_CONFIG.accountId) return;
  if (!privateKey && !HEDERA_CONFIG.buyerPrivateKey) {
    // Buyer must associate manually or provide HEDERA_BUYER_PRIVATE_KEY
    console.warn(
      `Buyer ${accountId} must associate token ${tokenId} before transfer. Set HEDERA_BUYER_PRIVATE_KEY to auto-associate.`
    );
    return;
  }

  const { client } = getHederaClient();
  const key = parseHederaPrivateKey(privateKey || HEDERA_CONFIG.buyerPrivateKey);
  const associateTx = await new TokenAssociateTransaction()
    .setAccountId(AccountId.fromString(accountId))
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(key);

  try {
    const resp = await associateTx.execute(client);
    await resp.getReceipt(client);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT")) {
      throw err;
    }
  }
}

export async function mintLeaseNftToBuyer(params: {
  buyerAccountId: string;
  metadata: LeaseNftMetadata;
  buyerPrivateKey?: string;
}) {
  const { client, operatorId } = getHederaClient();
  const tokenId = await ensureLeaseCollection();
  const buyerId = params.buyerAccountId || HEDERA_CONFIG.buyerAccountId || operatorId.toString();

  const metaBytes = new Uint8Array(
    Buffer.from(
      JSON.stringify({
        name: `BuySpace Lease - ${params.metadata.title}`,
        description:
          "Time-bound airspace lease certificate. Title remains with the property owner. This NFT proves leased use rights for the term.",
        assetClass: "AIRSPACE_LEASE",
        ...params.metadata,
      }),
      "utf8"
    )
  );

  const mintTx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata([metaBytes])
    .execute(client);

  const mintReceipt = await mintTx.getReceipt(client);
  if (mintReceipt.status !== Status.Success) {
    throw new Error(`Lease NFT mint failed: ${mintReceipt.status}`);
  }

  const serial = mintReceipt.serials[0];
  const serialStr = serial.toString();
  const mintTxId = mintTx.transactionId.toString();

  // Transfer to buyer if different from treasury
  let transferTxId = mintTxId;
  if (buyerId !== operatorId.toString()) {
    await associateIfNeeded(tokenId, buyerId, params.buyerPrivateKey);
    const transfer = await new TransferTransaction()
      .addNftTransfer(tokenId, serial, operatorId, AccountId.fromString(buyerId))
      .execute(client);
    const transferReceipt = await transfer.getReceipt(client);
    if (transferReceipt.status !== Status.Success) {
      throw new Error(`Lease NFT transfer failed: ${transferReceipt.status}`);
    }
    transferTxId = transfer.transactionId.toString();
  }

  return {
    tokenId,
    serial: serialStr,
    buyerAccountId: buyerId,
    transactionId: transferTxId,
    mintTransactionId: mintTxId,
    hashscanNftUrl: `${HEDERA_CONFIG.hashscanBase}/token/${tokenId}/${serialStr}`,
    hashscanTxUrl: hashscanTxUrl(transferTxId),
    hashscanCollectionUrl: hashscanTokenUrl(tokenId),
  };
}

export async function burnLeaseNft(tokenId: string, serial: string) {
  const { client, operatorId } = getHederaClient();

  // Ensure treasury holds it (demo: if buyer holds it, wipe requires wipe key  -  we burn from treasury only)
  // For demo burn after reclaim: transfer back first if needed is out of scope;
  // burn works when NFT is in treasury.
  try {
    const info = await new TokenNftInfoQuery()
      .setNftId(NftId.fromString(`${tokenId}@${serial}`))
      .execute(client);
    const owner = info[0]?.accountId?.toString();
    if (owner && owner !== operatorId.toString()) {
      throw new Error(
        `Lease NFT ${tokenId}@${serial} is held by ${owner}. Transfer to treasury before burn, or show Arkiv expiry as validity end.`
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("held by")) throw err;
  }

  const burn = await new TokenBurnTransaction()
    .setTokenId(tokenId)
    .setSerials([Number(serial)])
    .execute(client);
  const receipt = await burn.getReceipt(client);
  if (receipt.status !== Status.Success) {
    throw new Error(`Burn failed: ${receipt.status}`);
  }
  return {
    transactionId: burn.transactionId.toString(),
    hashscanTxUrl: hashscanTxUrl(burn.transactionId.toString()),
  };
}
