import type { FamilyId } from "../3d/cars/families";

// Per-car paint schemes and sponsor placement (liveries.json, researched from
// period photos). Sponsor names are painted as plain type, not logo artwork.

export type Zone =
  | "nose"
  | "noseTop"
  | "cockpitSurround"
  | "engineCover"
  | "sidepods"
  | "frontWing"
  | "rearWing"
  | "rearWingEndplates"
  | "frontWingEndplates"
  | "airbox"
  | "wheels"
  | "floor";

export type Slot =
  | "noseTop"
  | "noseSide"
  | "sidepodSide"
  | "engineCoverSide"
  | "rearWingTop"
  | "rearWingEndplate"
  | "frontWingEndplate"
  | "cockpitSide";

export interface Decal {
  slot: Slot;
  text: string;
  color: string;
  background?: string | null;
}

export interface Livery {
  base: string;
  finish: "gloss" | "satin" | "matte";
  zones: Partial<Record<Zone, string>>;
  stripes?: { zone: Zone; color: string; note?: string }[];
  raceNumbers?: Record<string, number>;
  numberSlot?: Slot | "none";
  shield?: Slot[];
  decals?: Decal[];
  confidence?: "high" | "medium" | "low";
}

export interface SuitDesign {
  year?: number;
  base: string;
  accents: { area: "shoulders" | "sides" | "collar" | "legs" | "belt"; color: string }[];
  style: "overalls" | "polo-and-trousers";
}

const files = import.meta.glob<{ cars?: Record<string, Livery>; suits?: Record<string, SuitDesign> }>(
  "./liveries.json",
  { eager: true, import: "default" },
);
const data = Object.values(files)[0] ?? {};

// Until a car is researched: rosso corsa with the era's usual contrasts.
const fallback: Record<FamilyId, Livery> = {
  front50s: { base: "#b3121a", finish: "gloss", zones: {}, shield: ["noseSide"] },
  rear60s: { base: "#b3121a", finish: "gloss", zones: {}, shield: ["noseSide"] },
  wing70s: {
    base: "#c1121c",
    finish: "gloss",
    zones: { airbox: "#c1121c" },
    stripes: [{ zone: "noseTop", color: "#f2efe8" }],
    shield: ["cockpitSide"],
  },
  flat80s: { base: "#c3121c", finish: "gloss", zones: { noseTop: "#f2efe8" }, shield: ["noseSide"] },
  v10: { base: "#c3121c", finish: "gloss", zones: { nose: "#f2efe8" }, shield: ["noseSide", "engineCoverSide"] },
  hybrid14: {
    base: "#c3121c",
    finish: "satin",
    zones: { rearWing: "#15161a", frontWing: "#15161a" },
    shield: ["noseSide", "engineCoverSide"],
  },
  wide17: {
    base: "#c3121c",
    finish: "satin",
    zones: { rearWing: "#15161a", frontWing: "#15161a" },
    shield: ["noseSide", "engineCoverSide"],
  },
  ground22: {
    base: "#c3121c",
    finish: "matte",
    zones: { rearWing: "#15161a", frontWing: "#15161a", engineCover: "#c3121c" },
    shield: ["noseSide", "engineCoverSide"],
  },
  active26: {
    base: "#c3121c",
    finish: "matte",
    zones: { rearWing: "#15161a", frontWing: "#15161a" },
    shield: ["noseSide", "engineCoverSide"],
  },
};

const normalise = (s: string) => s.toLowerCase().replace(/[\s-]/g, "");
const byKey = new Map(Object.entries(data.cars ?? {}).map(([k, v]) => [normalise(k), v]));

export function liveryFor(carName: string | null, family: FamilyId): Livery {
  const researched = carName ? byKey.get(normalise(carName)) : undefined;
  return researched ?? fallback[family];
}

export const suitFor = (driverId: string): SuitDesign | undefined => data.suits?.[driverId];
