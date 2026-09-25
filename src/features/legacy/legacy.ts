import { create } from "zustand";
import record from "../../data/constructors.json";
import { drivers } from "../../data/drivers";
import { carNameFor } from "../../data/cars";

// Ferrari's constructors' world championships. Points, wins and drivers come
// from the Jolpica import (constructors.json); leadership, cars, notes and
// trophy eras come from the researched constructorsLegacy.json when present.

interface Person {
  name: string;
  role: string;
  note?: string;
}
interface Research {
  titles?: Record<
    string,
    {
      car?: string[];
      carNote?: string;
      teamPrincipal?: Person;
      technicalLeads?: Person[];
      note?: string;
      sourceIds?: string[];
    }
  >;
  dreamTeam?: (Person & { sourceIds?: string[] })[];
  championshipName?: { note: string; sourceIds?: string[] };
  sources?: Record<string, { title: string; publisher: string; url: string }>;
}
const files = import.meta.glob<Research>("../../data/constructorsLegacy.json", {
  eager: true,
  import: "default",
});
const research: Research = Object.values(files)[0] ?? {};

export interface ConstructorsTitle {
  year: number;
  points: number;
  wins: number;
  drivers: { id: string; name: string; bay: number | null }[];
  car: string[];
  carNote?: string;
  /** The award's name that season. */
  award: string;
  teamPrincipal?: Person;
  technicalLeads: Person[];
  note?: string;
  sources: { title: string; publisher: string; url: string }[];
}

export const titles: ConstructorsTitle[] = record.titles.map((t) => {
  const r = research.titles?.[String(t.year)];
  return {
    year: t.year,
    points: t.points,
    wins: t.wins,
    // Jolpica driver ids match the museum's, so bays can be linked directly.
    drivers: t.drivers.map((d) => {
      const bay = drivers.findIndex((x) => x.id === d.id);
      return { id: d.id, name: d.name, bay: bay >= 0 ? bay : null };
    }),
    // Researched cars first; otherwise the sourced car of a museum driver that year.
    car:
      r?.car ??
      [
        ...new Set(
          t.drivers
            .map((d) => drivers.find((x) => x.id === d.id))
            .map((d) => (d ? carNameFor(d, t.year) : null))
            .filter((c): c is string => !!c),
        ),
      ],
    carNote: r?.carNote,
    // Renamed from the International Cup for F1 Manufacturers in 1981.
    award: t.year < 1981 ? "International Cup for F1 Manufacturers" : "World Constructors' Championship",
    teamPrincipal: r?.teamPrincipal,
    technicalLeads: r?.technicalLeads ?? [],
    note: r?.note,
    sources: (r?.sourceIds ?? []).map((id) => research.sources?.[id]).filter((s): s is NonNullable<typeof s> => !!s),
  };
});

// Only members whom the sources explicitly name as part of the "dream team";
// entries the research flagged with a caveat note are left out.
export const dreamTeam = (research.dreamTeam ?? []).filter((p) => !p.note);
export const legacySource = record.source;

/** "1999–2004": the longest run of consecutive titles. */
export const longestRun = (() => {
  let best = [titles[0].year, titles[0].year];
  let start = titles[0].year;
  titles.forEach((t, i) => {
    if (i > 0 && t.year !== titles[i - 1].year + 1) start = t.year;
    if (t.year - start > best[1] - best[0]) best = [start, t.year];
  });
  return best;
})();

interface LegacyState {
  selected: number | null;
  select: (year: number | null) => void;
}
export const useLegacyStore = create<LegacyState>((set) => ({
  selected: null,
  select: (selected) => set({ selected }),
}));
