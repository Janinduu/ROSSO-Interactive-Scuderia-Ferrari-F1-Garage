import { create } from "zustand";
import { drivers } from "../../data/drivers";
import type { Driver } from "../../data/drivers";
import { careerTitles } from "../../data/careerStats";
import { carNameFor } from "../../data/cars";

// Ferrari's drivers' world champions, from the sourced career titles: one
// station per driver, one trophy per title won with Ferrari.
export interface Champion {
  driver: Driver;
  index: number;
  titles: { year: number; car: string | null }[];
}

export const champions: Champion[] = drivers
  .map((driver, index) => ({
    driver,
    index,
    titles: careerTitles(driver.id)
      .filter((t) => t.team === "Ferrari")
      .map((t) => ({ year: t.year, car: carNameFor(driver, t.year) })),
  }))
  .filter((c) => c.titles.length > 0)
  .sort((a, b) => a.titles[0].year - b.titles[0].year);

export const titleCount = champions.reduce((n, c) => n + c.titles.length, 0);

const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
export const inWords = (n: number) => {
  const w = words[n] ?? String(n);
  return w[0].toUpperCase() + w.slice(1);
};


interface HallState {
  /** Index into `champions` of the station being studied, or null for the room. */
  focus: number | null;
  setFocus: (focus: number | null) => void;
  /** Station under the pointer, for the room's shared hover light. */
  hover: number | null;
  setHover: (hover: number | null) => void;
}
export const useHallStore = create<HallState>((set) => ({
  focus: null,
  setFocus: (focus) => set({ focus }),
  hover: null,
  setHover: (hover) => set({ hover }),
}));
