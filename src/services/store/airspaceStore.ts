import fs from "fs";
import path from "path";
import { AirspaceLease, TokenizedAirspace } from "@/types/airspace";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "airspace-store.json");

export interface AirspaceStore {
  titles: TokenizedAirspace[];
  leases: AirspaceLease[];
  leaseNftCollectionId?: string;
}

function ensureStore(): AirspaceStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const empty: AirspaceStore = { titles: [], leases: [] };
    fs.writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as AirspaceStore;
}

function writeStore(store: AirspaceStore) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export function getStore(): AirspaceStore {
  return ensureStore();
}

export function saveTitle(title: TokenizedAirspace) {
  const store = ensureStore();
  store.titles.unshift(title);
  writeStore(store);
  return title;
}

export function listTitles() {
  return ensureStore().titles;
}

export function getTitle(idOrTokenId: string) {
  return ensureStore().titles.find(
    (t) => t.id === idOrTokenId || t.titleTokenId === idOrTokenId
  );
}

export function saveLease(lease: AirspaceLease) {
  const store = ensureStore();
  store.leases.unshift(lease);
  writeStore(store);
  return lease;
}

export function updateLease(id: string, patch: Partial<AirspaceLease>) {
  const store = ensureStore();
  const idx = store.leases.findIndex((l) => l.id === id || l.entityKey === id);
  if (idx < 0) throw new Error(`Lease not found: ${id}`);
  store.leases[idx] = { ...store.leases[idx], ...patch };
  writeStore(store);
  return store.leases[idx];
}

export function listLeases() {
  return ensureStore().leases;
}

export function getLease(id: string) {
  return ensureStore().leases.find((l) => l.id === id || l.entityKey === id);
}

export function setLeaseNftCollectionId(tokenId: string) {
  const store = ensureStore();
  store.leaseNftCollectionId = tokenId;
  writeStore(store);
}

export function getLeaseNftCollectionId() {
  return ensureStore().leaseNftCollectionId;
}
