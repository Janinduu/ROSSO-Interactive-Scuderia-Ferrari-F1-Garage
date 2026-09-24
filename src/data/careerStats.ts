import stats from "./careerStats.json";

// Career-wide figures (all teams) and the current season to date, researched
// with sources in careerStats.json. Ferrari-only results come from history.json.

interface Title {
  year: number;
  team: string;
}
interface CareerStats {
  careerTitles?: Title[];
  polesWithFerrari?: number;
  careerWins?: number;
  careerPoles?: number;
  sourceIds?: string[];
}
interface CurrentSeason {
  car?: string;
  wins?: { race: string; date: string }[];
  poles?: number;
  championshipPosition?: number | null;
  championshipPoints?: number;
  positionAsOf?: string;
  moments?: string[];
  sourceIds?: string[];
}
interface Source {
  title: string;
  publisher: string;
  url: string;
}

const data = stats as unknown as {
  asOf: string;
  drivers: Record<string, CareerStats>;
  season2026?: Record<string, CurrentSeason>;
  sources: Record<string, Source>;
};

export const STATS_AS_OF = data.asOf;
export const CURRENT_SEASON = 2026;

export const careerFor = (id: string): CareerStats => data.drivers[id] ?? {};
export const currentSeasonFor = (id: string): CurrentSeason | undefined => data.season2026?.[id];

export function careerTitles(id: string): Title[] {
  return careerFor(id).careerTitles ?? [];
}

export function statSources(id: string): Source[] {
  const ids = [...(careerFor(id).sourceIds ?? []), ...(currentSeasonFor(id)?.sourceIds ?? [])];
  return [...new Set(ids)].map((s) => data.sources[s]).filter((s): s is Source => !!s);
}

/** "1994 · 1995 Benetton · 2000–2004 Ferrari": consecutive years collapse to ranges. */
export function titleRuns(id: string) {
  const runs: { from: number; to: number; team: string }[] = [];
  for (const t of careerTitles(id)) {
    const last = runs.at(-1);
    if (last && last.team === t.team && last.to === t.year - 1) last.to = t.year;
    else runs.push({ from: t.year, to: t.year, team: t.team });
  }
  return runs;
}
