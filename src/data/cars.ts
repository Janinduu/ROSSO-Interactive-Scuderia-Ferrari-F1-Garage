import { familyForYear, specForYear } from "../3d/cars/families";
import type { CarSpec, FamilyId } from "../3d/cars/families";
import type { Driver } from "./drivers";
import { seasonStory } from "./drivers";

// Car registry (spec §10, §23.3). Maps a driver's season to a car name and to a
// procedural representation, and states honestly how accurate that is.

export type RepresentationType =
  | "licensed_exact"
  | "historically_informed"
  | "era_family"
  | "placeholder";

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
};

// Researched, sourced mapping (optional until the research pack is reviewed).
type ResearchedYears = Record<string, Record<string, { primary: string }>>;
const researchFiles = import.meta.glob<ResearchedYears>("./carsByYear.json", {
  eager: true,
  import: "default",
});
const researched: ResearchedYears = Object.values(researchFiles)[0] ?? {};

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
  return {
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
