#!/usr/bin/env node
/** Redeploy only AirspaceLeaseMarket (Hedera msg.value fix) and patch .env */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { config as loadEnv } from "dotenv";
import { ContractFactory, JsonRpcProvider, Wallet } from "ethers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
loadEnv({ path: path.join(root, ".env") });
const require = createRequire(import.meta.url);

async function compile(sourcePath, contractName) {
  const solc = require("solc");
  const source = fs.readFileSync(sourcePath, "utf8");
  const input = {
    language: "Solidity",
    sources: { [path.basename(sourcePath)]: { content: source } },
    settings: {
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

async function connect() {
  const rpcs = [
    "https://testnet.hashio.io/api",
    process.env.HEDERA_RPC_URL,
    process.env.NEXT_PUBLIC_HEDERA_RPC_URL,
  ].filter(Boolean);
  let last;
  for (const rpc of [...new Set(rpcs)]) {
    for (let i = 1; i <= 4; i++) {
      try {
        const provider = new JsonRpcProvider(rpc, 296, { staticNetwork: true });
        await provider.getBlockNumber();
        return { provider, rpc };
      } catch (e) {
        last = e;
        console.warn(rpc, "try", i, e.shortMessage || e.message);
        await new Promise((r) => setTimeout(r, 1500 * i));
      }
    }
  }
  throw last;
}

async function main() {
  const pk = process.env.HEDERA_PRIVATE_KEY;
  if (!pk) throw new Error("HEDERA_PRIVATE_KEY required");
  const { provider, rpc } = await connect();
  const key = pk.startsWith("0x") ? pk : `0x${pk}`;
  const wallet = new Wallet(key, provider);
  console.log("Deployer", wallet.address, "RPC", rpc);

  const art = await compile(
    path.join(root, "src/contracts/AirspaceLeaseMarket.sol"),
    "AirspaceLeaseMarket"
  );
  const factory = new ContractFactory(art.abi, art.bytecode, wallet);
  let market;
  for (let i = 1; i <= 4; i++) {
    try {
      console.log("Deploy attempt", i);
      market = await factory.deploy();
      await market.waitForDeployment();
      break;
    } catch (e) {
      console.warn(e.shortMessage || e.message);
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
  if (!market) throw new Error("deploy failed");
  const addr = await market.getAddress();
  console.log("AirspaceLeaseMarket", addr);

  fs.writeFileSync(
    path.join(root, "src/abis/AirspaceLeaseMarket.json"),
    JSON.stringify(art.abi, null, 2)
  );

  const envPath = path.join(root, ".env");
  let env = fs.readFileSync(envPath, "utf8");
  if (/^NEXT_PUBLIC_AIRSPACE_MARKET_ADDRESS=/m.test(env)) {
    env = env.replace(
      /^NEXT_PUBLIC_AIRSPACE_MARKET_ADDRESS=.*$/m,
      `NEXT_PUBLIC_AIRSPACE_MARKET_ADDRESS=${addr}`
    );
  } else {
    env += `\nNEXT_PUBLIC_AIRSPACE_MARKET_ADDRESS=${addr}\n`;
  }
  fs.writeFileSync(envPath, env);
  console.log("Updated .env market address. Restart next dev.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
