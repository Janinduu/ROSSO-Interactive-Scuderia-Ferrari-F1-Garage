import { poses } from "../../3d/camera/poses";
import type { CameraPose } from "../../3d/camera/poses";
import { drivers, eras, getTotals, seasonStory } from "../../data/drivers";
import { parts } from "../../data/engineering";
import { resolveCar } from "../../data/cars";
import { careerTitles } from "../../data/careerStats";
import { anchorsFor, CAR_SCALE } from "../../3d/cars/anchors";
import { explodedOffset } from "../../3d/cars/explode";
import type { PartId } from "../../data/engineering";
import type { Room, Section } from "../../stores/museumStore";
import { champions, inWords, titleCount } from "../hall/champions";
import { longestRun, titles as constructorsTitles } from "../legacy/legacy";

export type TourStepId =
  | "intro"
  | "evolution"
  | "pioneers"
  | "racing_spirit"
  | "schumacher"
  | "car_reveal"
  | "engineering_demo"
  | "season_moment"
  | "present_day"
  | "hall"
  | "legacy"
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
    room: Room;
    driverIndex: number;
    year: number;
    section: Section;
    part: PartId | null;
    exploded: boolean;
  };
  allowSkip: boolean;
}

// Reading time: roughly 230 words per minute plus time to look at the scene.
const dwell = (text: string) => Math.min(13000, Math.max(5000, 2500 + text.split(/\s+/).length * 260));

const bayOf = (id: string) => drivers.findIndex((d) => d.id === id);
const chapterOf = (i: number) => String(eras.indexOf(drivers[i].era) + 1).padStart(2, "0");

// The museum tour (spec §16): from the Evolution room through the chapters to
// the Hall of Champions and the Legacy room. Every factual line is derived
// from the sourced data in src/data, never written here.
export function buildMuseumTour(): TourStepDefinition[] {
  const schumacher = bayOf("michael_schumacher");
  const ascari = bayOf("ascari");
  const lauda = bayOf("lauda");
  const hamilton = bayOf("hamilton");
  const msc = drivers[schumacher];
  const totals = getTotals(msc.id);
  const year = 2004;
  const season = seasonStory(msc, year);
  const diffuser = parts.find((p) => p.id === "diffuser")!;
  const anchors = anchorsFor(resolveCar(msc, year).spec);
  const explodedAnchor = (id: PartId) => {
    const a = anchors[id] ?? [0, 0, 0];
    const o = explodedOffset(id, 1);
    return a.map((v, i) => v + o[i] * CAR_SCALE);
  };
  const scene = (room: Room, driverIndex: number, y: number) => ({
    room,
    driverIndex,
    year: y,
    section: "story" as Section,
    part: null as PartId | null,
    exploded: false,
  });
  // A driver's bay on one season, told with that season's sourced story.
  const bayStep = (id: TourStepId, index: number, y: number): Omit<TourStepDefinition, "durationMs"> => {
    const d = drivers[index];
    const s = seasonStory(d, y);
    return {
      id,
      kicker: `Chapter ${chapterOf(index)} · ${d.era}`,
      title: `${d.name}, ${y}: ${s.title.replace(/\.$/, "")}`,
      narration: s.story,
      camera: poses.bay(index),
      scene: scene("garage", index, y),
      allowSkip: true,
    };
  };
  const firstTitle = careerTitles("ascari").find((t) => t.team === "Ferrari");
  const hamiltonNow = seasonStory(drivers[hamilton], 2026);
  const run = longestRun[1] - longestRun[0] + 1;

  const steps: (Omit<TourStepDefinition, "durationMs"> & { durationMs?: number })[] = [
    {
      id: "intro",
      kicker: "Guided tour",
      title: "Welcome to ROSSO.",
      narration:
        "A walk through the museum: the cars, the drivers of each chapter, one car taken apart, and the rooms where the titles are kept. Pause, skip or leave whenever you like.",
      camera: poses.evolution(),
      scene: scene("evolution", schumacher, year),
      allowSkip: true,
    },
    {
      id: "evolution",
      kicker: "The Evolution room",
      title: "Seventy-five years on one turntable.",
      narration:
        "Twenty cars, 1951 to 2026, each in its own colours and with its own engine note: front engines give way to wings, ground effect, V10s and hybrids.",
      camera: poses.evolution(),
      scene: scene("evolution", schumacher, year),
      durationMs: 16000,
      allowSkip: true,
    },
    bayStep("pioneers", ascari, firstTitle?.year ?? 1952),
    bayStep("racing_spirit", lauda, 1975),
    {
      id: "schumacher",
      kicker: `Chapter ${chapterOf(schumacher)} · ${msc.era}`,
      title: msc.tagline,
      narration: `${msc.name}: ${totals.wins} Grand Prix wins and ${totals.podiums} podiums in red, counted from Ferrari Grand Prix results only.`,
      camera: poses.identity(schumacher),
      scene: scene("garage", schumacher, year),
      allowSkip: true,
    },
    {
      id: "car_reveal",
      kicker: `${year} · Car study`,
      title: season.car,
      narration: `The car of the ${year} season, shown as a historically informed study: original geometry, an interpretation rather than a replica.`,
      camera: poses.carReveal(schumacher),
      scene: scene("garage", schumacher, year),
      allowSkip: true,
    },
    {
      id: "engineering_demo",
      kicker: "The machine",
      title: diffuser.name,
      narration: `${diffuser.text} (General principle; the exact design varies by era.)`,
      camera: poses.part(schumacher, explodedAnchor("diffuser")),
      // The car opens up (spec §16.2 "explodeCar") and the camera finds the diffuser.
      scene: { ...scene("garage", schumacher, year), section: "engineering", part: "diffuser", exploded: true },
      allowSkip: true,
    },
    {
      id: "season_moment",
      kicker: msc.championshipsWithFerrari.includes(year) ? `${year} · World champion` : `${year}`,
      title: season.title,
      narration: season.story,
      camera: poses.bay(schumacher),
      scene: scene("garage", schumacher, year),
      allowSkip: true,
    },
    {
      id: "present_day",
      kicker: `Chapter ${chapterOf(hamilton)} · ${drivers[hamilton].era}`,
      title: `${drivers[hamilton].name}, 2026`,
      narration: hamiltonNow.story,
      camera: poses.bay(hamilton),
      scene: scene("garage", hamilton, 2026),
      allowSkip: true,
    },
    {
      id: "hall",
      kicker: "The Hall of Champions",
      title: `${inWords(titleCount)} titles. ${inWords(champions.length)} champions.`,
      narration: `Every drivers' world championship won in a Ferrari, from ${champions[0].driver.name} in ${champions[0].titles[0].year} to ${champions.at(-1)!.driver.name} in ${champions.at(-1)!.titles.at(-1)!.year}. Each has a station: the helmet, and one trophy for every title.`,
      camera: poses.hall(),
      scene: scene("hall", hamilton, 2026),
      allowSkip: true,
    },
    {
      id: "legacy",
      kicker: "The Legacy room",
      title: `${inWords(constructorsTitles.length)} constructors' championships.`,
      narration: `The team's titles, ${constructorsTitles[0].year} to ${constructorsTitles.at(-1)!.year}, including ${inWords(run).toLowerCase()} in a row from ${longestRun[0]} to ${longestRun[1]}.`,
      camera: poses.legacy(),
      scene: scene("legacy", hamilton, 2026),
      allowSkip: true,
    },
    {
      id: "complete",
      kicker: "Tour complete",
      title: "The museum is yours.",
      narration:
        "Walk the corridor bay by bay, relive a race in the Theatre, or compare two Ferraris lap for lap in the Race Lab.",
      camera: poses.legacy(),
      scene: scene("legacy", hamilton, 2026),
      allowSkip: false,
    },
  ];
  return steps.map((s) => ({
    ...s,
    durationMs: s.id === "complete" ? Infinity : (s.durationMs ?? dwell(s.narration)),
  }));
}
