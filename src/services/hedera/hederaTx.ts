"use client";

import {
  JsonRpcProvider,
  type JsonRpcSigner,
  type TransactionRequest,
  type Provider,
  type TransactionReceipt,
} from "ethers";
import { Interface } from "ethers";
import type { Eip1193Provider } from "@/context/HederaWalletContext";
import {
  HEDERA_PRIMARY_RPC,
  HEDERA_TESTNET_RPCS,
  hederaRpcFetch,
} from "@/config/hederaRpc";

export const HEDERA_TX_GAS = BigInt(500_000);
export const HEDERA_PURCHASE_GAS = BigInt(1_200_000);
export const HEDERA_GAS_PRICE_FLOOR = BigInt(1_300_000_000_000); // 1300 gwei

export function shortAirspaceUri(payload: Record<string, unknown>) {
  return `airspace:${JSON.stringify(payload).slice(0, 96)}`;
}

function toHex(n: bigint): `0x${string}` {
  return `0x${n.toString(16)}` as `0x${string}`;
}

function normalizeAddress(addr: string) {
  return addr.startsWith("0x") ? addr : `0x${addr}`;
}

function explainWalletSendError(err: unknown): Error {
  const msg = String((err as any)?.message || (err as any)?.shortMessage || err || "");
  const lower = msg.toLowerCase();

  if (
    lower.includes("too many errors") ||
    lower.includes("rpc endpoint") ||
    lower.includes("rate limit") ||
    lower.includes("502") ||
    lower.includes("503")
  ) {
    return new Error(
      `Hedera RPC is failing in MetaMask. Settings → Networks → Hedera Testnet → RPC URL = ${HEDERA_PRIMARY_RPC} (chain 296), then retry.`
    );
  }

  if (
    lower.includes("wallet_sendtransaction") ||
    lower.includes("eth_sendtransaction") ||
    lower.includes("unsupported method") ||
    lower.includes("method not found") ||
    lower.includes("does not support") ||
    lower.includes("provider does not support")
  ) {
    return new Error(
      `Wallet rejected eth_sendTransaction. Use MetaMask on chain 296 with RPC ${HEDERA_PRIMARY_RPC}, or HashPack ECDSA Testnet.`
    );
  }
  if (
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    lower.includes("rejected the request")
  ) {
    return new Error("Transaction rejected in wallet");
  }
  return new Error((err as any)?.shortMessage || msg || "Transaction failed");
}

function makeProvider(rpcUrl: string) {
  return new JsonRpcProvider(rpcUrl, 296, { staticNetwork: true });
}

export async function resolveHederaGasPrice(provider?: Provider | null) {
  try {
    if (provider) {
      const fee = await provider.getFeeData();
      if (fee.gasPrice && fee.gasPrice > BigInt(0)) {
        return (fee.gasPrice * BigInt(120)) / BigInt(100);
      }
    }
  } catch {
    /* fall through */
  }

  try {
    const hex = await hederaRpcFetch<string>("eth_gasPrice", []);
    if (hex?.startsWith("0x")) {
      const n = BigInt(hex);
      if (n > BigInt(0)) return (n * BigInt(120)) / BigInt(100);
    }
  } catch {
    /* fall through */
  }

  for (const url of HEDERA_TESTNET_RPCS) {
    try {
      const fee = await makeProvider(url).getFeeData();
      if (fee.gasPrice && fee.gasPrice > BigInt(0)) {
        return (fee.gasPrice * BigInt(120)) / BigInt(100);
      }
    } catch {
      /* try next */
    }
  }
  return HEDERA_GAS_PRICE_FLOOR;
}

async function waitForReceipt(txHash: string): Promise<TransactionReceipt> {
  for (let i = 0; i < 45; i++) {
    for (const url of HEDERA_TESTNET_RPCS) {
      try {
        const receipt = await makeProvider(url).getTransactionReceipt(txHash);
        if (receipt) {
          if (receipt.status === 0) throw new Error("Transaction reverted on Hedera");
          return receipt;
        }
      } catch (err: any) {
        if (String(err?.message || "").includes("reverted")) throw err;
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Timed out waiting for ${txHash} — check HashScan`);
}

/**
 * ONLY supported send path for HashPack / MetaMask on Hedera EVM.
 * Never use viem writeContract / sendTransaction (those call wallet_sendTransaction).
 */
export async function sendEthTransaction(args: {
  eip1193: Eip1193Provider;
  from: string;
  to: string;
  data: string;
  value?: bigint;
  gas?: bigint;
  gasPrice?: bigint;
}): Promise<TransactionReceipt> {
  const gasPrice = args.gasPrice ?? (await resolveHederaGasPrice(null));
  const gas = args.gas ?? HEDERA_TX_GAS;
  const value = args.value ?? BigInt(0);

  const tx = {
    from: normalizeAddress(args.from),
    to: normalizeAddress(args.to),
    data: args.data || "0x",
    value: toHex(value),
    gas: toHex(gas),
    gasPrice: toHex(gasPrice),
  };

  let hash: string;
  try {
    hash = (await args.eip1193.request({
      method: "eth_sendTransaction",
      params: [tx],
    })) as string;
  } catch (err) {
    throw explainWalletSendError(err);
  }

  if (!hash || typeof hash !== "string") {
    throw new Error("Wallet did not return a transaction hash");
  }
  return waitForReceipt(hash);
}

export async function writeContractViaEip1193(args: {
  eip1193: Eip1193Provider;
  from: string;
  address: string;
  abi: readonly any[] | any[];
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
  gas?: bigint;
  chainId?: number | null;
}): Promise<TransactionReceipt> {
  if (args.chainId && args.chainId !== 296) {
    throw new Error(
      `Wrong network: wallet is on chain ${args.chainId}. Switch to Hedera Testnet (296).`
    );
  }

  const iface = new Interface(args.abi as any);
  const data = iface.encodeFunctionData(args.functionName, [...(args.args || [])]);

  let gasPrice: bigint | undefined;
  try {
    const gp = await args.eip1193.request({ method: "eth_gasPrice", params: [] });
    if (typeof gp === "string" && gp.startsWith("0x")) {
      const n = BigInt(gp);
      if (n > BigInt(0)) gasPrice = (n * BigInt(120)) / BigInt(100);
    }
  } catch {
    /* use resolver with RPC failover */
  }

  return sendEthTransaction({
    eip1193: args.eip1193,
    from: args.from,
    to: args.address,
    data,
    value: args.value,
    gas: args.gas ?? HEDERA_TX_GAS,
    gasPrice,
  });
}

export async function sendHederaContractTx(
  signer: JsonRpcSigner,
  txRequest: TransactionRequest,
  eip1193?: Eip1193Provider | null
) {
  const from = await signer.getAddress();
  const provider = signer.provider;
  if (!provider) throw new Error("No provider on signer");

  const gasPrice = await resolveHederaGasPrice(provider);
  const gas = BigInt(txRequest.gasLimit ?? HEDERA_TX_GAS);
  const value = BigInt(txRequest.value ?? 0);
  const to = String(txRequest.to || "");
  const data = String(txRequest.data || "0x");

  const requestProvider: Eip1193Provider = eip1193 ?? {
    request: async ({ method, params }) => (provider as any).send(method, params ?? []),
  };

  return sendEthTransaction({
    eip1193: requestProvider,
    from,
    to,
    data,
    value,
    gas,
    gasPrice,
  });
}
