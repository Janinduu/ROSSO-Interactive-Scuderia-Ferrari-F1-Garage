import { poses } from "../../3d/camera/poses";
import type { CameraPose } from "../../3d/camera/poses";
import {
  drivers,
  getHistory,
  getTotals,
  seasonStory,
} from "../../data/drivers";
import { parts } from "../../data/engineering";
import { resolveCar } from "../../data/cars";
import { anchorsFor } from "../../3d/cars/anchors";
import type { PartId } from "../../data/engineering";
import { SCHUMACHER_INDEX } from "../../stores/museumStore";
import type { Section } from "../../stores/museumStore";

export type TourStepId =
  | "intro"
  | "chapter_intro"
  | "approach_bay"
  | "driver_identity"
  | "car_reveal"
  | "engineering_demo"
  | "season_moment"
  | "exit_bay"
  | "complete";

export interface TourStepDefinition {
  id: TourStepId;
  kicker: string;
  title: string;
  narration: string;
  camera: CameraPose;
  /** Dwell after the camera arrives. Infinity waits for the visitor. */
  durationMs: number;
  /** Museum state this step stages (spec §16.2 uiMode + action). */
  scene: {
    driverIndex: number;
    year: number;
    section: Section;
    part: PartId | null;
  };
  /** Whether the driver story column is shown, or the corridor stays clear. */
  showStory: boolean;
  allowSkip: boolean;
}

// Reading time: roughly 230 words per minute plus time to look at the scene.
const dwell = (text: string) =>
  Math.min(12000, Math.max(4500, 2500 + text.split(/\s+/).length * 260));

const word = (n: number) =>
  [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
    "sixteen", "seventeen",
  ][n] ?? String(n);

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

// Spec §16.4: one excellent Schumacher mini-tour. Every factual statement is
// derived from the sourced archive in src/data rather than written here.
export function buildSchumacherTour(): TourStepDefinition[] {
  const bay = SCHUMACHER_INDEX;
  const driver = drivers[bay];
  const totals = getTotals(driver.id);
  const seasons = getHistory(driver.id).seasons.length;
  const titles = driver.championshipsWithFerrari;
  const year = 2004;
  const season = seasonStory(driver, year);
  const diffuser = parts.find((p) => p.id === "diffuser")!;
  const base = { driverIndex: bay, year, section: "story" as const, part: null };

  const steps: Omit<TourStepDefinition, "durationMs">[] = [
    {
      id: "intro",
      kicker: "Guided tour",
      title: "Welcome to the garage.",
      narration:
        "A short walk through one bay of the museum: a driver’s Ferrari years, the car study of a defining season and one piece of its engineering. Pause, skip or leave whenever you like.",
      camera: poses.corridor(bay),
      scene: base,
      showStory: false,
      allowSkip: true,
    },
    {
      id: "chapter_intro",
      kicker: `Chapter 04 · ${driver.ferrariYears}`,
      title: `${driver.era}.`,
      narration: `${driver.name} drove for Ferrari from ${driver.ferrariYears.replace("–", " to ")}: ${word(seasons)} seasons and ${word(titles.length)} drivers’ world championships, won from ${titles[0]} to ${titles.at(-1)}.`,
      camera: poses.chapterEntrance(bay),
      scene: base,
      showStory: false,
      allowSkip: true,
    },
    {
      id: "approach_bay",
      kicker: `Bay ${driver.number}`,
      title: "Entering the bay.",
      narration:
        "As you step in, the rest of the garage falls away. Each bay holds one driver’s story, their seasons and a study of the car they raced.",
      camera: poses.bay(bay),
      scene: base,
      showStory: true,
      allowSkip: true,
    },
    {
      id: "driver_identity",
      kicker: "Driver identity",
      title: driver.tagline,
      narration: `${totals.wins} Grand Prix wins and ${totals.podiums} podiums in red, counted from Ferrari Grand Prix results only — sprints and other teams are excluded.`,
      camera: poses.identity(bay),
      scene: base,
      showStory: true,
      allowSkip: true,
    },
    {
      id: "car_reveal",
      kicker: `${year} · Car study`,
      title: season.car,
      narration: `The car of the ${year} season, shown as a historically informed study. The geometry is original project work — an interpretation, not a replica of Ferrari’s design.`,
      camera: poses.carReveal(bay),
      scene: base,
      showStory: true,
      allowSkip: true,
    },
    {
      id: "engineering_demo",
      kicker: "The machine",
      title: diffuser.name,
      narration: `${diffuser.text} (General principle; the exact design varies by era.)`,
      camera: poses.part(bay, anchorsFor(resolveCar(driver, year).spec).diffuser ?? diffuser.position),
      scene: { ...base, section: "engineering", part: "diffuser" },
      showStory: true,
      allowSkip: true,
    },
    {
      id: "season_moment",
      kicker: titles.includes(year) ? `${year} · World champion` : `${year}`,
      title: season.title,
      narration: season.story,
      camera: poses.bay(bay),
      scene: base,
      showStory: true,
      allowSkip: true,
    },
    {
      id: "exit_bay",
      kicker: "The corridor",
      title: "Back to the garage.",
      narration: `${capitalize(word(drivers.length - 1))} more bays are waiting, from ${drivers[0].name} to the present day. Use the driver directory or Next driver to continue.`,
      camera: poses.corridor(bay),
      scene: base,
      showStory: false,
      allowSkip: true,
    },
    {
      id: "complete",
      kicker: "Tour complete",
      title: "The garage is yours.",
      narration:
        "Orbit the car, open The Machine to inspect its components, or choose another season from the timeline below.",
      camera: poses.bay(bay),
      scene: base,
      showStory: true,
      allowSkip: false,
    },
  ];
  return steps.map((s) => ({
    ...s,
    durationMs: s.id === "complete" ? Infinity : dwell(s.narration),
  }));
}
