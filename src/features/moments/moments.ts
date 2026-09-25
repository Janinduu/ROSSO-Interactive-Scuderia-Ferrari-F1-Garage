// Legendary Moments: replays of races built from lap data. Each driver's
// position is interpolated between the end-of-lap times the archive records,
// so gaps are exact at the line and approximate within a lap.

export interface RaceDriver {
  id: string;
  code: string;
  name: string;
  team: string;
  ferrari: boolean;
  number: number | null;
  grid: number;
  finish: number;
  status: string;
  cumulative: number[];
}
export interface RaceData {
  id: string;
  season: number;
  round: number;
  raceName: string;
  date: string;
  circuitName: string;
  location: string;
  laps: number;
  drivers: RaceDriver[];
  track: [number, number][];
  sources: { results: string; laps: string; circuit: string };
}
interface Research {
  moments?: Record<
    string,
    { title?: string; summary?: string; conditions?: string; captions?: { lap: number; text: string }[]; sourceIds?: string[] }
  >;
  sources?: Record<string, { title: string; publisher: string; url: string }>;
}
const researchFiles = import.meta.glob<Research>("../../data/momentsResearch.json", {
  eager: true,
  import: "default",
});
const research: Research = Object.values(researchFiles)[0] ?? {};

// Race data is loaded only when a replay is opened.
const loaders = import.meta.glob<RaceData>("../../data/moments/*.json", { import: "default" });

export interface MomentMeta {
  id: string;
  season: number;
  /** The museum driver the moment belongs to (links the bay). */
  driverId: string;
  fallbackTitle: string;
  circuit: string;
}

export const momentList: MomentMeta[] = [
  { id: "spain-1996", season: 1996, driverId: "michael_schumacher", fallbackTitle: "Barcelona, 1996", circuit: "Barcelona" },
  { id: "japan-2000", season: 2000, driverId: "michael_schumacher", fallbackTitle: "Suzuka, 2000", circuit: "Suzuka" },
  { id: "france-2004", season: 2004, driverId: "michael_schumacher", fallbackTitle: "Magny-Cours, 2004", circuit: "Magny-Cours" },
  { id: "brazil-2007", season: 2007, driverId: "raikkonen", fallbackTitle: "Interlagos, 2007", circuit: "Interlagos" },
  { id: "italy-2019", season: 2019, driverId: "leclerc", fallbackTitle: "Monza, 2019", circuit: "Monza" },
  { id: "barcelona-2026", season: 2026, driverId: "hamilton", fallbackTitle: "Barcelona, 2026", circuit: "Barcelona" },
];

export const momentStory = (id: string) => research.moments?.[id];
export const momentSources = (id: string) =>
  (research.moments?.[id]?.sourceIds ?? [])
    .map((s) => research.sources?.[s])
    .filter((s): s is NonNullable<typeof s> => !!s);

export const momentFor = (driverId: string, season: number) =>
  momentList.find((m) => m.driverId === driverId && m.season === season);

export async function loadRace(id: string): Promise<RaceData> {
  const load = loaders[`../../data/moments/${id}.json`];
  if (!load) throw new Error(`No race data for ${id}`);
  return load();
}

/** A closed track resampled by arc length, so equal fractions are equal distances. */
export class Track {
  readonly points: [number, number][];
  private readonly lengths: number[];
  readonly total: number;
  /** Bounding box of the outline in track units. */
  readonly box: { x0: number; y0: number; x1: number; y1: number };
  constructor(raw: [number, number][]) {
    this.points = raw;
    const xs = raw.map((p) => p[0]);
    const ys = raw.map((p) => p[1]);
    this.box = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    this.lengths = [0];
    for (let i = 1; i <= raw.length; i++) {
      const [ax, ay] = raw[i - 1];
      const [bx, by] = raw[i % raw.length];
      this.lengths.push(this.lengths[i - 1] + Math.hypot(bx - ax, by - ay));
    }
    this.total = this.lengths[raw.length];
  }
  /** Point and heading at a fraction (0..1) of the lap. */
  at(fraction: number): { x: number; y: number; angle: number } {
    const d = (((fraction % 1) + 1) % 1) * this.total;
    let lo = 0;
    let hi = this.points.length;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.lengths[mid] <= d) lo = mid;
      else hi = mid;
    }
    const [ax, ay] = this.points[lo];
    const [bx, by] = this.points[(lo + 1) % this.points.length];
    const seg = this.lengths[lo + 1] - this.lengths[lo] || 1;
    const t = (d - this.lengths[lo]) / seg;
    return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, angle: Math.atan2(by - ay, bx - ax) };
  }
}

export interface CarState {
  driver: RaceDriver;
  /** Laps completed plus the fraction of the current lap. */
  distance: number;
  running: boolean;
  finished: boolean;
}

/** Where every car is at a moment of race time (ms from the start). */
export function raceState(race: RaceData, t: number): CarState[] {
  return race.drivers
    .map((d) => {
      const c = d.cumulative;
      if (!c.length) return { driver: d, distance: 0, running: false, finished: false };
      const lastLap = c.length;
      if (t >= c[lastLap - 1]) {
        const finished = lastLap === race.laps || /lap/i.test(d.status) || d.status === "Finished";
        return { driver: d, distance: lastLap, running: false, finished };
      }
      let lap = 0;
      while (c[lap] <= t) lap++;
      const start = lap === 0 ? 0 : c[lap - 1];
      const frac = (t - start) / (c[lap] - start);
      // Grid order before the start: stagger cars behind the line.
      const distance = t <= 0 ? -d.grid * 0.004 : lap + frac;
      return { driver: d, distance, running: true, finished: false };
    })
    .sort((a, b) => b.distance - a.distance);
}

/** The race time of the leader's lap end, for scrubbing by lap. */
export function timeAtLap(race: RaceData, lap: number) {
  const leader = race.drivers.find((d) => d.finish === 1) ?? race.drivers[0];
  if (lap <= 0) return 0;
  return leader.cumulative[Math.min(lap, leader.cumulative.length) - 1];
}

export function raceDuration(race: RaceData) {
  const leader = race.drivers.find((d) => d.finish === 1) ?? race.drivers[0];
  return leader.cumulative.at(-1)!;
}

/** Gap to the leader: laps down, or seconds at the last line both cars crossed. */
export function gapToLeader(car: CarState, leader: CarState) {
  const lap = Math.floor(car.distance);
  if (lap < 1) return null;
  // Lapped only when a full lap behind on the road, not merely across the line.
  const lapsDown = Math.floor(leader.distance - car.distance);
  if (lapsDown >= 1) return `+${lapsDown} ${lapsDown === 1 ? "lap" : "laps"}`;
  const mine = car.driver.cumulative[lap - 1];
  const theirs = leader.driver.cumulative[lap - 1];
  if (mine == null || theirs == null) return null;
  return `+${((mine - theirs) / 1000).toFixed(1)}`;
}
