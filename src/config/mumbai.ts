/** ETHGlobal Mumbai  -  centered on Jio World Centre, BKC */

export const JIO_WORLD_CENTRE = {
  name: "Jio World Centre",
  address: "G Block, Bandra Kurla Complex, Mumbai 400051",
  latitude: 19.0612,
  longitude: 72.8628,
  /** Mapbox [lng, lat] */
  center: [72.8628, 19.0612] as [number, number],
};

export type MumbaiBuilding = {
  id: number;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  height: number;
  pricePerSqFt: number;
  availableSqFt: number;
  airRightsVolume: number;
  viewProtected: boolean;
  row: number;
  currentHeight: number;
  maximumHeight: number;
  footprint: [number, number][];
};

function box(lng: number, lat: number, d = 0.00045): [number, number][] {
  return [
    [lng - d, lat - d],
    [lng - d, lat + d],
    [lng + d, lat + d],
    [lng + d, lat - d],
    [lng - d, lat - d],
  ];
}

/** Sample airspace parcels around Jio World Centre / BKC for the hero map */
export const MUMBAI_BUILDINGS: MumbaiBuilding[] = [
  {
    id: 1,
    name: "Jio World Centre",
    coordinates: [72.8628, 19.0612],
    height: 55,
    pricePerSqFt: 920,
    availableSqFt: 22000,
    airRightsVolume: 280000,
    viewProtected: false,
    row: 1,
    currentHeight: 18,
    maximumHeight: 45,
    footprint: box(72.8628, 19.0612, 0.00055),
  },
  {
    id: 2,
    name: "One BKC",
    coordinates: [72.8695, 19.0665],
    height: 70,
    pricePerSqFt: 1050,
    availableSqFt: 18500,
    airRightsVolume: 310000,
    viewProtected: true,
    row: 1,
    currentHeight: 22,
    maximumHeight: 50,
    footprint: box(72.8695, 19.0665),
  },
  {
    id: 3,
    name: "Maker Maxity",
    coordinates: [72.8708, 19.0598],
    height: 48,
    pricePerSqFt: 880,
    availableSqFt: 14200,
    airRightsVolume: 195000,
    viewProtected: false,
    row: 1,
    currentHeight: 16,
    maximumHeight: 38,
    footprint: box(72.8708, 19.0598),
  },
  {
    id: 4,
    name: "The Capital  -  BKC",
    coordinates: [72.8672, 19.0638],
    height: 62,
    pricePerSqFt: 990,
    availableSqFt: 16000,
    airRightsVolume: 240000,
    viewProtected: false,
    row: 2,
    currentHeight: 20,
    maximumHeight: 48,
    footprint: box(72.8672, 19.0638),
  },
  {
    id: 5,
    name: "Equinox Business Park",
    coordinates: [72.8585, 19.0645],
    height: 42,
    pricePerSqFt: 760,
    availableSqFt: 12800,
    airRightsVolume: 170000,
    viewProtected: true,
    row: 2,
    currentHeight: 14,
    maximumHeight: 32,
    footprint: box(72.8585, 19.0645),
  },
  {
    id: 6,
    name: "Godrej BKC",
    coordinates: [72.8655, 19.0575],
    height: 58,
    pricePerSqFt: 940,
    availableSqFt: 17500,
    airRightsVolume: 255000,
    viewProtected: false,
    row: 2,
    currentHeight: 19,
    maximumHeight: 44,
    footprint: box(72.8655, 19.0575),
  },
];

export const MUMBAI_AIR_RIGHT_TICKER = [
  { city: "BKC", price: "$920.00", isUp: true },
  { city: "JWC", price: "$1,050.00", isUp: true },
  { city: "WR", price: "$780.40", isUp: false },
  { city: "NAVI", price: "$410.25", isUp: true },
  { city: "POW", price: "$645.80", isUp: false },
  { city: "AND", price: "$702.15", isUp: true },
  { city: "COL", price: "$1,180.00", isUp: true },
  { city: "BAN", price: "$855.60", isUp: false },
  { city: "THN", price: "$390.90", isUp: true },
];
