import { create } from "zustand";
import { drivers } from "../data/drivers";
import type { PartId } from "../data/engineering";

export type Section = "story" | "engineering";
/** Special rooms outside the driver bays. */
export type Room = "garage" | "evolution" | "hall" | "legacy";

export const SCHUMACHER_INDEX = drivers.findIndex(
  (d) => d.id === "michael_schumacher",
);

interface MuseumState {
  entered: boolean;
  room: Room;
  driverIndex: number;
  year: number;
  section: Section;
  part: PartId | null;
  /** Exploded engineering view (spec §12). */
  exploded: boolean;
  /** Show only the selected component. */
  isolate: boolean;
  /** Bumped when the visitor picks a component, so the camera goes to it. */
  partFocus: number;
  /** Bumped to ask the camera to return to the current framing. */
  viewResets: number;
  enter: () => void;
  enterRoom: (room: Room) => void;
  leave: () => void;
  selectDriver: (index: number) => void;
  setYear: (year: number) => void;
  openStory: () => void;
  openEngineering: (part?: PartId) => void;
  setPart: (part: PartId | null) => void;
  focusPart: (part: PartId) => void;
  setExploded: (exploded: boolean) => void;
  toggleIsolate: () => void;
  resetView: () => void;
  /** Used by the guided tour to set the whole scene in one update. */
  stage: (
    scene: Partial<
      Pick<MuseumState, "entered" | "room" | "driverIndex" | "year" | "section" | "part" | "exploded">
    >,
  ) => void;
}

// Where the visitor is in the museum (spec §30). Dialogs and filters stay local
// to the components that own them.
export const useMuseumStore = create<MuseumState>((set) => ({
  entered: false,
  room: "garage",
  driverIndex: SCHUMACHER_INDEX,
  year: 2004,
  section: "story",
  part: null,
  exploded: false,
  isolate: false,
  partFocus: 0,
  viewResets: 0,
  enter: () => set({ entered: true }),
  enterRoom: (room) =>
    set({ entered: true, room, section: "story", part: null, exploded: false, isolate: false }),
  leave: () =>
    set({ entered: false, room: "garage", section: "story", part: null, exploded: false, isolate: false }),
  selectDriver: (index) =>
    set((s) => ({
      entered: true,
      room: "garage",
      driverIndex: index,
      year: drivers[index].defaultYear,
      part: null,
      exploded: false,
      isolate: false,
      viewResets: s.viewResets + 1,
    })),
  setYear: (year) => set({ year }),
  openStory: () =>
    set({ entered: true, room: "garage", section: "story", part: null, exploded: false, isolate: false }),
  openEngineering: (part = "front-wing") =>
    set({ entered: true, room: "garage", section: "engineering", part }),
  setPart: (part) => set({ part }),
  focusPart: (part) => set((s) => ({ part, partFocus: s.partFocus + 1 })),
  setExploded: (exploded) => set({ exploded }),
  toggleIsolate: () => set((s) => ({ isolate: !s.isolate })),
  resetView: () => set((s) => ({ viewResets: s.viewResets + 1 })),
  stage: (scene) => set(scene),
}));
