/**
 * Hedera Asset Tokenization Studio (ATS) — tokenize an AIRSPACE parcel (not land)
 * as an Equity security token.
 */
import {
  Network,
  Equity,
  Security,
  PauseRequest,
  CreateEquityRequest,
  SupportedWallets,
  InitializationRequest,
  ConnectRequest,
} from "@hashgraph/asset-tokenization-sdk";
import { HEDERA_CONFIG, hashscanTokenUrl, hashscanTxUrl, requireHederaEnv } from "@/config/chains";
import { AirspaceParcel, TokenizedAirspace } from "@/types/airspace";
import { saveTitle } from "@/services/store/airspaceStore";
import { randomUUID } from "crypto";

let atsReady = false;

async function ensureAtsConnected() {
  requireHederaEnv();
  if (atsReady) return;

  const mirrorNode = {
    name: "hedera-testnet-mirror",
    baseUrl: HEDERA_CONFIG.mirrorNode,
  };
  const rpcNode = {
    name: "hedera-hashio",
    baseUrl: HEDERA_CONFIG.rpcUrl,
  };

  await Network.init(
    new InitializationRequest({
      network: HEDERA_CONFIG.network,
      mirrorNode,
      rpcNode,
      configuration: {
        factoryAddress: HEDERA_CONFIG.factoryAddress,
        resolverAddress: HEDERA_CONFIG.resolverAddress,
      },
    })
  );

  await Network.connect(
    new ConnectRequest({
      account: {
        accountId: HEDERA_CONFIG.accountId,
        privateKey: {
          key: HEDERA_CONFIG.privateKey.replace(/^0x/, ""),
          type: "ECDSA",
        },
        evmAddress: HEDERA_CONFIG.evmAddress,
        ...(HEDERA_CONFIG.publicKey
          ? {
              publicKey: {
                key: HEDERA_CONFIG.publicKey.replace(/^0x/, ""),
                type: "ECDSA",
              },
            }
          : {}),
      },
      network: HEDERA_CONFIG.network,
      wallet: SupportedWallets.METAMASK,
      mirrorNode,
      rpcNode,
    })
  );

  atsReady = true;
}

function parcelSymbol(parcel: AirspaceParcel) {
  const slug = parcel.city.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "AIR";
  return `AIR${slug}`.slice(0, 10);
}

/**
 * Issue ATS Equity representing permanent TITLE to an airspace parcel.
 * Land / building are NOT tokenized — only the vertical envelope above the property.
 */
export async function tokenizeAirspace(parcel: AirspaceParcel): Promise<TokenizedAirspace> {
  await ensureAtsConnected();

  const shares = String(parcel.numberOfShares ?? Math.max(parcel.availableFloors, 1));
  const info = JSON.stringify({
    assetClass: "AIRSPACE_RIGHTS",
    notLand: true,
    propertyAddress: parcel.propertyAddress,
    currentHeight: parcel.currentHeight,
    maximumHeight: parcel.maximumHeight,
    availableFloors: parcel.availableFloors,
    coordinates: { lat: parcel.latitude, lng: parcel.longitude },
    rightsType: parcel.rightsType,
  });

  const request = new CreateEquityRequest({
    name: parcel.title.slice(0, 100),
    symbol: parcelSymbol(parcel),
    isin: `AIR${Date.now().toString().slice(-9)}Z`,
    decimals: 0,
    isWhiteList: false,
    erc20VotesActivated: false,
    isControllable: true,
    arePartitionsProtected: false,
    clearingActive: false,
    internalKycActivated: false,
    isMultiPartition: false,
    diamondOwnerAccount: HEDERA_CONFIG.accountId,
    votingRight: true,
    informationRight: true,
    liquidationRight: false,
    subscriptionRight: false,
    conversionRight: false,
    redemptionRight: false,
    putRight: false,
    dividendRight: 1,
    currency: "0x555344", // USD
    numberOfShares: shares,
    nominalValue: parcel.nominalValue || "1000",
    nominalValueDecimals: 2,
    regulationType: 0,
    regulationSubType: 0,
    isCountryControlListWhiteList: true,
    countries: "IN,US",
    info,
    configId:
      process.env.ATS_EQUITY_CONFIG_ID ||
      "0x0000000000000000000000000000000000000000000000000000000000000001",
    configVersion: Number(process.env.ATS_EQUITY_CONFIG_VERSION || "1"),
  });

  const result = await Equity.create(request);
  const security = result.security as {
    diamondAddress?: string;
    evmDiamondAddress?: string;
  };
  const titleTokenId = security.diamondAddress || "";
  const txId = (result as { transactionId?: string }).transactionId || "";

  // Lifecycle op for ATS demo: pause then unpause is heavy; pause once to show control,
  // or skip if already paused. We attempt pause as the required lifecycle operation.
  let lifecycleTxId: string | undefined;
  try {
    if (titleTokenId) {
      const pauseRes = await Security.pause(
        new PauseRequest({ securityId: titleTokenId })
      );
      lifecycleTxId = (pauseRes as { transactionId?: string }).transactionId;
    }
  } catch (err) {
    console.warn("ATS pause lifecycle skipped:", err);
  }

  const record: TokenizedAirspace = {
    id: randomUUID(),
    parcel,
    titleTokenId,
    evmDiamondAddress: security.evmDiamondAddress,
    ownerAccountId: HEDERA_CONFIG.accountId,
    ownerEvmAddress: HEDERA_CONFIG.evmAddress,
    transactionId: txId,
    hashscanUrl: titleTokenId ? hashscanTokenUrl(titleTokenId) : "",
    createdAt: new Date().toISOString(),
    paused: Boolean(lifecycleTxId),
    lifecycleTxId,
  };

  return saveTitle(record);
}

export async function getAtsStatus() {
  try {
    requireHederaEnv();
    return {
      configured: true,
      network: HEDERA_CONFIG.network,
      accountId: HEDERA_CONFIG.accountId,
      factory: HEDERA_CONFIG.factoryAddress,
      resolver: HEDERA_CONFIG.resolverAddress,
    };
  } catch (e) {
    return {
      configured: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export { hashscanTxUrl };
