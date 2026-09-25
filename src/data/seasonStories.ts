import cars from "./carsByYear.json";

// Researched, sourced season stories and key races (seasonStories/*.json).
interface Story {
  title: string;
  story: string;
  sourceIds?: string[];
}
interface KeyRace {
  year: number;
  race: string;
  text: string;
  sourceIds?: string[];
}
interface Source {
  title: string;
  publisher: string;
  url: string;
}
interface Pack {
  seasons?: Record<string, Record<string, Story>>;
  keyRaces?: Record<string, KeyRace[]>;
  sources?: Record<string, Source>;
}
const packs = Object.values(
  import.meta.glob<Pack>("./seasonStories/*.json", { eager: true, import: "default" }),
);
const seasons: Record<string, Record<string, Story>> = {};
const keyRaces: Record<string, KeyRace[]> = {};
const sources: Record<string, Source> = {};
for (const p of packs) {
  for (const [id, s] of Object.entries(p.seasons ?? {})) seasons[id] = { ...seasons[id], ...s };
  for (const [id, r] of Object.entries(p.keyRaces ?? {})) keyRaces[id] = [...(keyRaces[id] ?? []), ...r];
  Object.assign(sources, p.sources ?? {});
}

const primaryCar = (driverId: string, year: number) =>
  (cars as unknown as Record<string, Record<string, { primary?: string }>>)[driverId]?.[String(year)]?.primary;

/** A researched story for a season, with its car from the sourced mapping. */
export function researchedSeason(driverId: string, year: number) {
  const s = seasons[driverId]?.[String(year)];
  if (!s) return undefined;
  return { car: primaryCar(driverId, year) ?? "Season archive", title: s.title, story: s.story };
}

export const keyRacesFor = (driverId: string) =>
  [...(keyRaces[driverId] ?? [])].sort((a, b) => a.year - b.year);

/** Sources behind a season's story and the driver's key races. */
export function storySources(driverId: string, year: number): Source[] {
  const ids = [
    ...(seasons[driverId]?.[String(year)]?.sourceIds ?? []),
    ...(keyRaces[driverId] ?? []).flatMap((r) => r.sourceIds ?? []),
  ];
  return [...new Set(ids)].map((id) => sources[id]).filter((s): s is Source => !!s);
}
