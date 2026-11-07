import {
  AccountId,
  Client,
  PrivateKey,
} from "@hashgraph/sdk";
import { HEDERA_CONFIG, requireHederaEnv } from "@/config/chains";

export function parseHederaPrivateKey(raw: string): PrivateKey {
  const key = raw.trim();
  // DER-encoded (starts with 302e / 302d) or hex ECDSA
  if (key.startsWith("0x") || /^[0-9a-fA-F]{64}$/.test(key)) {
    const hex = key.replace(/^0x/, "");
    try {
      return PrivateKey.fromStringECDSA(hex);
    } catch {
      return PrivateKey.fromStringED25519(hex);
    }
  }
  try {
    return PrivateKey.fromStringECDSA(key);
  } catch {
    return PrivateKey.fromString(key);
  }
}

export function getHederaClient(): { client: Client; operatorId: AccountId; operatorKey: PrivateKey } {
  requireHederaEnv();
  const operatorId = AccountId.fromString(HEDERA_CONFIG.accountId);
  const operatorKey = parseHederaPrivateKey(HEDERA_CONFIG.privateKey);
  const client =
    HEDERA_CONFIG.network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
  client.setOperator(operatorId, operatorKey);
  return { client, operatorId, operatorKey };
}
