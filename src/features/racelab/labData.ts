// Race Lab: measured telemetry (OpenF1) of the two Ferrari drivers' fastest
// qualifying laps, resampled every few metres so the laps can be compared at
// the same point on track.

export interface LabDriver {
  number: number;
  code: string;
  name: string;
  colour?: string;
  lapTime: number;
  lapNumber: number;
  sectors: (number | null)[];
  speedTrap: number | null;
  position: number | null;
  length: number;
  /** Rows of [distance_m, time_ms, speed_kph, throttle_pct, brake, gear, rpm, x, y]. */
  samples: number[][];
}
export interface LabSession {
  id: string;
  year: number;
  session: string;
  circuit: string;
  country: string;
  location: string;
  date: string;
  drivers: LabDriver[];
  source: string;
}

export const COL = { d: 0, t: 1, speed: 2, throttle: 3, brake: 4, gear: 5, rpm: 6, x: 7, y: 8 } as const;

const loaders = import.meta.glob<LabSession>("../../data/racelab/*.json", { import: "default" });
export const labIds = Object.keys(loaders)
  .map((p) => p.split("/").at(-1)!.replace(/\.json$/, ""))
  .sort((a, b) => Number(a.slice(-4)) - Number(b.slice(-4)));

export async function loadLab(id: string): Promise<LabSession> {
  return loaders[`../../data/racelab/${id}.json`]();
}

/** Labels for the session picker. */
export const labMeta: Record<string, { title: string; circuit: string }> = {
  "singapore-2023": { title: "Singapore 2023", circuit: "Marina Bay" },
  "monaco-2024": { title: "Monaco 2024", circuit: "Monte Carlo" },
  "monza-2024": { title: "Monza 2024", circuit: "Monza" },
  "hungary-2025": { title: "Hungary 2025", circuit: "Hungaroring" },
  "barcelona-2026": { title: "Barcelona 2026", circuit: "Barcelona-Catalunya" },
  "silverstone-2026": { title: "Silverstone 2026", circuit: "Silverstone" },
};

/** The sample at a distance (linear between rows). */
export function atDistance(d: LabDriver, dist: number): number[] {
  const s = d.samples;
  const step = s.length > 1 ? s[1][0] - s[0][0] : 1;
  const i = Math.max(0, Math.min(s.length - 2, Math.floor(dist / step)));
  const a = s[i];
  const b = s[i + 1];
  const k = Math.max(0, Math.min(1, (dist - a[0]) / (b[0] - a[0] || 1)));
  return a.map((v, j) => v + (b[j] - v) * k);
}

/** The sample at a lap time (ms). */
export function atTime(d: LabDriver, t: number): number[] {
  const s = d.samples;
  let lo = 0;
  let hi = s.length - 1;
  if (t >= s[hi][COL.t]) return s[hi];
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid][COL.t] <= t) lo = mid;
    else hi = mid;
  }
  const a = s[lo];
  const b = s[hi];
  const k = (t - a[COL.t]) / (b[COL.t] - a[COL.t] || 1);
  return a.map((v, j) => v + (b[j] - v) * k);
}

/** Time gap of driver B relative to A at each distance, in seconds (positive: B slower). */
export function deltaTrace(a: LabDriver, b: LabDriver, points = 400) {
  const len = Math.min(a.length, b.length);
  return Array.from({ length: points + 1 }, (_, i) => {
    const d = (len * i) / points;
    return [d, (atDistance(b, d)[COL.t] - atDistance(a, d)[COL.t]) / 1000] as [number, number];
  });
}

/** Who was quicker through each of `n` equal slices of the lap. */
export function miniSectors(a: LabDriver, b: LabDriver, n = 24) {
  const len = Math.min(a.length, b.length);
  return Array.from({ length: n }, (_, i) => {
    const d0 = (len * i) / n;
    const d1 = (len * (i + 1)) / n;
    const ta = atDistance(a, d1)[COL.t] - atDistance(a, d0)[COL.t];
    const tb = atDistance(b, d1)[COL.t] - atDistance(b, d0)[COL.t];
    return { d0, d1, faster: ta <= tb ? 0 : 1, margin: Math.abs(ta - tb) / 1000 };
  });
}

export const fmtLap = (s: number) => {
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(3).padStart(6, "0")}`;
};

/** Museum drivers in each session (by bay id), for links from their seasons. */
const labDrivers: Record<string, string[]> = {
  "singapore-2023": ["sainz", "leclerc"],
  "monaco-2024": ["leclerc", "sainz"],
  "monza-2024": ["leclerc", "sainz"],
  "hungary-2025": ["leclerc", "hamilton"],
  "barcelona-2026": ["hamilton", "leclerc"],
  "silverstone-2026": ["hamilton", "leclerc"],
};
export const labFor = (driverId: string, year: number) =>
  labIds.find((id) => id.endsWith(String(year)) && labDrivers[id]?.includes(driverId));
