#!/usr/bin/env node
/**
 * Compile + deploy AirspaceTitle + AirspaceLeaseMarket to Hedera testnet (Hashio).
 * Uses HEDERA_PRIVATE_KEY / HEDERA_EVM_ADDRESS from .env — one-time infra deploy only.
 * Demo mint/list/buy still happen from connected wallets in the UI.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { config as loadEnv } from "dotenv";
import { ContractFactory, JsonRpcProvider, Wallet } from "ethers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
loadEnv({ path: path.join(root, ".env.local") });
loadEnv({ path: path.join(root, ".env") });

const require = createRequire(import.meta.url);

async function compile(sourcePath, contractName) {
  const solc = require("solc");
  const source = fs.readFileSync(sourcePath, "utf8");
  const input = {
    language: "Solidity",
    sources: { [path.basename(sourcePath)]: { content: source } },
    settings: {
      // Hedera JSON-RPC historically breaks on Shanghai PUSH0 — use London
      evmVersion: "london",
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
    },
  };
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  if (out.errors?.some((e) => e.severity === "error")) {
    console.error(out.errors);
    throw new Error(`Compile failed: ${contractName}`);
  }
  const artifact = out.contracts[path.basename(sourcePath)][contractName];
  return { abi: artifact.abi, bytecode: artifact.evm.bytecode.object };
}

async function connectProvider(preferred) {
  const candidates = [
    preferred,
    "https://hedera-testnet-rpc.publicnode.com",
    process.env.HEDERA_RPC_URL,
    process.env.NEXT_PUBLIC_HEDERA_RPC_URL,
    "https://testnet.hashio.io/api",
    "https://296.rpc.thirdweb.com",
  ].filter(Boolean);
  const unique = [...new Set(candidates)];
  let lastErr;
  for (const rpc of unique) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`RPC ${rpc} (try ${attempt})…`);
        const provider = new JsonRpcProvider(rpc, 296, { staticNetwork: true });
        await provider.getBlockNumber();
        return { provider, rpc };
      } catch (err) {
        lastErr = err;
        console.warn(`  failed: ${err?.shortMessage || err?.message || err}`);
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }
  throw lastErr || new Error("No Hedera RPC available");
}

async function main() {
  const pk = process.env.HEDERA_PRIVATE_KEY;
  if (!pk) throw new Error("HEDERA_PRIVATE_KEY required for one-time deploy");
  const { provider, rpc } = await connectProvider(process.env.HEDERA_RPC_URL);
  const key = pk.startsWith("0x") ? pk : `0x${pk}`;
  const wallet = new Wallet(key, provider);
  console.log("Deployer:", wallet.address);
  console.log("RPC:", rpc);
  console.log("Balance:", (await provider.getBalance(wallet.address)).toString());

  const titleArt = await compile(
    path.join(root, "src/contracts/AirspaceTitle.sol"),
    "AirspaceTitle"
  );
  const marketArt = await compile(
    path.join(root, "src/contracts/AirspaceLeaseMarket.sol"),
    "AirspaceLeaseMarket"
  );

  async function deployWithRetry(factory, label) {
    let lastErr;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        console.log(`Deploying ${label} (attempt ${attempt})…`);
        const c = await factory.deploy();
        await c.waitForDeployment();
        return c;
      } catch (err) {
        lastErr = err;
        console.warn(`  ${label} failed:`, err?.shortMessage || err?.message || err);
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
    throw lastErr;
  }

  // Re-resolve a healthy RPC right before send (Hashio often 502s mid-flight)
  const live = await connectProvider("https://hedera-testnet-rpc.publicnode.com");
  const liveWallet = new Wallet(key, live.provider);
  console.log("Deploy RPC:", live.rpc);

  const titleFactory = new ContractFactory(titleArt.abi, titleArt.bytecode, liveWallet);
  const title = await deployWithRetry(titleFactory, "AirspaceTitle");
  const titleAddr = await title.getAddress();
  console.log("AirspaceTitle:", titleAddr);

  const marketFactory = new ContractFactory(marketArt.abi, marketArt.bytecode, liveWallet);
  const market = await deployWithRetry(marketFactory, "AirspaceLeaseMarket");
  const marketAddr = await market.getAddress();
  console.log("AirspaceLeaseMarket:", marketAddr);

  const envLines = [
    "",
    "# --- Live demo contracts (Hedera testnet) ---",
    `NEXT_PUBLIC_AIRSPACE_TITLE_ADDRESS=${titleAddr}`,
    `NEXT_PUBLIC_AIRSPACE_MARKET_ADDRESS=${marketAddr}`,
    `NEXT_PUBLIC_HEDERA_RPC_URL=${rpc}`,
  ].join("\n");

  for (const file of [".env", ".env.local"]) {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) continue;
    let text = fs.readFileSync(p, "utf8");
    text = text
      .replace(/^NEXT_PUBLIC_AIRSPACE_TITLE_ADDRESS=.*$/m, "")
      .replace(/^NEXT_PUBLIC_AIRSPACE_MARKET_ADDRESS=.*$/m, "")
      .replace(/^NEXT_PUBLIC_HEDERA_RPC_URL=.*$/m, "");
    text = text.trimEnd() + "\n" + envLines + "\n";
    fs.writeFileSync(p, text);
    console.log("Updated", file);
  }

  fs.writeFileSync(
    path.join(root, "src/abis/AirspaceTitle.json"),
    JSON.stringify(titleArt.abi, null, 2)
  );
  fs.writeFileSync(
    path.join(root, "src/abis/AirspaceLeaseMarket.json"),
    JSON.stringify(marketArt.abi, null, 2)
  );
  console.log("\nDone. Restart npm run dev, then Connect Hedera → Tokenize → List → Buy.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
