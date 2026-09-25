import { create } from "zustand";
import { drivers } from "../../data/drivers";
import { resolveCar } from "../../data/cars";
import type { ResolvedCar } from "../../data/cars";

// "75 years in 75 seconds": one car roughly every four years, each tied to a
// real driver-season so its name, livery and number come from sourced data.
const plan: [year: number, driverId: string][] = [
  [1951, "ascari"],
  [1952, "ascari"],
  [1956, "fangio"],
  [1958, "hawthorn"],
  [1961, "phil_hill"],
  [1964, "surtees"],
  [1966, "surtees"],
  [1975, "lauda"],
  [1979, "scheckter"],
  [1982, "gilles_villeneuve"],
  [1990, "prost"],
  [1996, "michael_schumacher"],
  [2000, "michael_schumacher"],
  [2004, "michael_schumacher"],
  [2007, "raikkonen"],
  [2012, "alonso"],
  [2014, "alonso"],
  [2018, "vettel"],
  [2022, "leclerc"],
  [2026, "hamilton"],
];

export interface Milestone {
  year: number;
  driverId: string;
  driverName: string;
  car: ResolvedCar;
}

export const milestones: Milestone[] = plan.map(([year, id]) => {
  const driver = drivers.find((d) => d.id === id)!;
  return { year, driverId: id, driverName: driver.name, car: resolveCar(driver, year) };
});

export const FIRST_YEAR = 1950;
export const LAST_YEAR = 2026;
export const DURATION_MS = 75_000;

export const yearAt = (ms: number) =>
  Math.min(LAST_YEAR, FIRST_YEAR + Math.floor((ms / DURATION_MS) * (LAST_YEAR - FIRST_YEAR + 1)));

/** The milestone on show at a given moment: the latest one already reached. */
export function milestoneAt(ms: number) {
  const y = yearAt(ms);
  let index = 0;
  milestones.forEach((m, i) => {
    if (m.year <= y) index = i;
  });
  return index;
}

/** Time at which a milestone's year is reached, for scrubbing. */
export const timeOf = (index: number) =>
  index === 0
    ? 0
    : ((milestones[index].year - FIRST_YEAR) / (LAST_YEAR - FIRST_YEAR + 1)) * DURATION_MS + 1;

interface EvolutionState {
  playing: boolean;
  elapsed: number;
  play: () => void;
  pause: () => void;
  restart: () => void;
  seek: (ms: number) => void;
  tick: (dt: number) => void;
}

export const useEvolutionStore = create<EvolutionState>((set, get) => ({
  playing: false,
  elapsed: 0,
  play: () => set({ playing: true, elapsed: get().elapsed >= DURATION_MS ? 0 : get().elapsed }),
  pause: () => set({ playing: false }),
  restart: () => set({ playing: true, elapsed: 0 }),
  seek: (ms) => set({ elapsed: Math.max(0, Math.min(DURATION_MS, ms)) }),
  tick: (dt) => {
    const elapsed = Math.min(DURATION_MS, get().elapsed + dt);
    set({ elapsed, playing: elapsed < DURATION_MS });
  },
}));
