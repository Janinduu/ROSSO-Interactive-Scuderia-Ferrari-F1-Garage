import { familyForYear, specForYear } from "../3d/cars/families";
import type { CarSpec, FamilyId } from "../3d/cars/families";
import type { Driver } from "./drivers";
import { seasonStory } from "./drivers";
import { liveryFor } from "./liveries";
import type { Livery } from "./liveries";

// Car registry (spec §10, §23.3). Maps a driver's season to a car name and to a
// procedural representation, and states honestly how accurate that is.

export type RepresentationType =
  "licensed_exact" | "historically_informed" | "era_family" | "placeholder";

export interface ResolvedCar {
  /** Stable id for caching and React keys. */
  id: string;
  officialName: string | null;
  year: number;
  family: FamilyId;
  spec: CarSpec;
  representationType: RepresentationType;
  /** Short honest label shown under the car name. */
  accuracyLabel: string;
  livery: Livery;
  /** The driver's race number on this car, when researched. */
  raceNumber: number | null;
}

const normalise = (name: string) => name.toLowerCase().replace(/[\s-]/g, "");

// Tier 1 hero studies: tuned proportions for three reference cars.
const heroes: Record<string, FamilyId> = {
  f2004: "v10",
  "312t": "wing70s",
  sf71h: "wide17",
};

// Distinguishing features that are part of a car's well-documented identity.
const tweaks: Record<string, Partial<CarSpec>> = {
  // The Lancia-derived D50 carried its fuel in pannier tanks between the wheels.
  d50: { panniers: true },
  f2004: {
    engineCylinders: 10,
    pods: { x0: -0.48, x1: 1.32, z: 0.43, w: 0.205, y: 0.37, h: 0.175, n: 4 },
    frontWing: {
      x: -2.1,
      y: 0.12,
      span: 1.4,
      chord: 0.27,
      elements: 3,
      endplate: 0.2,
    },
    rearWing: {
      x: 1.94,
      y: 0.94,
      span: 0.96,
      chord: 0.28,
      elements: 2,
      endplate: 0.52,
    },
  },
  "312t": {
    engineCylinders: 12,
    pods: { x0: -0.36, x1: 0.58, z: 0.43, w: 0.22, y: 0.32, h: 0.14, n: 4 },
    frontWing: {
      x: -1.72,
      y: 0.27,
      span: 1.48,
      chord: 0.46,
      elements: 1,
      endplate: 0.09,
    },
  },
  sf71h: {
    engineCylinders: 6,
    pods: { x0: -0.72, x1: 1.27, z: 0.48, w: 0.23, y: 0.46, h: 0.165, n: 4 },
    frontWing: {
      x: -2.55,
      y: 0.105,
      span: 1.8,
      chord: 0.34,
      elements: 5,
      endplate: 0.28,
    },
  },
};

// Researched, sourced mapping (optional until the research pack is reviewed).
interface CarSource {
  title: string;
  publisher: string;
  url: string;
}
type ResearchedYears = Record<
  string,
  Record<string, { primary: string; sourceIds?: string[] }>
> & {
  _sources?: Record<string, CarSource>;
};
const researchFiles = import.meta.glob<ResearchedYears>("./carsByYear.json", {
  eager: true,
  import: "default",
});
const researched: ResearchedYears = Object.values(researchFiles)[0] ?? {};

/** Sources for the car named in a driver's season. */
export function carSourcesFor(driver: Driver, year: number): CarSource[] {
  const ids = researched[driver.id]?.[String(year)]?.sourceIds ?? [];
  return ids
    .map((id) => researched._sources?.[id])
    .filter((s): s is CarSource => !!s);
}

/** The official car name for a driver's season, or null if not yet sourced. */
export function carNameFor(driver: Driver, year: number): string | null {
  const fromResearch = researched[driver.id]?.[String(year)]?.primary;
  if (fromResearch) return fromResearch;
  const story = seasonStory(driver, year);
  if (story?.car && story.car !== "Season archive") return story.car;
  return null;
}

export function resolveCar(driver: Driver, year: number): ResolvedCar {
  const officialName = carNameFor(driver, year);
  const key = officialName ? normalise(officialName) : null;
  const heroFamily = key ? heroes[key] : undefined;
  const family = heroFamily ?? familyForYear(year);
  const spec = specForYear(family, year, key ? tweaks[key] : undefined);
  const livery = liveryFor(officialName, family);
  return {
    livery,
    raceNumber: livery.raceNumbers?.[driver.id] ?? null,
    id: `${key ?? family}-${year}`,
    officialName,
    year,
    family,
    spec,
    representationType: heroFamily ? "historically_informed" : "era_family",
    accuracyLabel: heroFamily
      ? "Historically informed 3D study · original geometry"
      : "Era representation · exact year model in development",
  };
}
