import { useEffect, useRef } from "react";
import { drivers } from "../../data/drivers";
import { resolveCar } from "../../data/cars";
import { useMuseumStore } from "../../stores/museumStore";
import { useTourStore } from "../../features/guided-tour/tourStore";
import { anchorsFor, CAR_SCALE } from "../cars/anchors";
import { explodedOffset } from "../cars/explode";
import { useCameraStore } from "./cameraStore";
import { poses } from "./poses";
import { titles, useLegacyStore } from "../../features/legacy/legacy";
import { legacyPlinth } from "../rooms/LegacyRoom";
import { stationPose } from "../rooms/HallRoom";
import { useHallStore } from "../../features/hall/champions";
import { playTransition } from "../../audio/soundEngine";

// Maps where the visitor is in the museum to a camera pose. While the guided
// tour runs it owns the camera instead; when it ends this restores the framing.
const bayGlide = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1200;
const reducedGlide = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 3200;

export function useMuseumCamera() {
  const entered = useMuseumStore((s) => s.entered);
  const room = useMuseumStore((s) => s.room);
  const bay = useMuseumStore((s) => s.driverIndex);
  const section = useMuseumStore((s) => s.section);
  const exploded = useMuseumStore((s) => s.exploded);
  const partFocus = useMuseumStore((s) => s.partFocus);
  const viewResets = useMuseumStore((s) => s.viewResets);
  const touring = useTourStore((s) => s.active);
  const legacyYear = useLegacyStore((s) => s.selected);
  const hallFocus = useHallStore((s) => s.focus);
  const lastFocus = useRef(partFocus);
  const lastBay = useRef(bay);
  const lastRoom = useRef(room);
  useEffect(() => {
    if (touring) return;
    const focused = partFocus !== lastFocus.current;
    lastFocus.current = partFocus;
    // Only a move between bays in the garage, not a flight in from a room.
    const bayChanged = bay !== lastBay.current && room === "garage" && lastRoom.current === "garage";
    lastBay.current = bay;
    lastRoom.current = room;
    const { part, year } = useMuseumStore.getState();
    if (entered && section === "engineering" && focused && part) {
      // Go to the component where it will be once any explode motion ends.
      const anchor = anchorsFor(resolveCar(drivers[bay], year).spec)[part];
      if (anchor) {
        const o = explodedOffset(part, exploded ? 1 : 0);
        useCameraStore.getState().go(
          poses.part(bay, anchor.map((v, i) => v + o[i] * CAR_SCALE)),
        );
        return;
      }
    }
    if (entered && room === "hall" && hallFocus != null) {
      useCameraStore.getState().go(poses.hallStation(stationPose(hallFocus)));
      return;
    }
    if (entered && room === "legacy" && legacyYear != null) {
      const i = titles.findIndex((t) => t.year === legacyYear);
      useCameraStore.getState().go(poses.legacyTrophy(legacyPlinth(i)));
      return;
    }
    if (entered && room !== "garage") {
      // Rooms at either end of the corridor: a slower, gliding approach.
      const pose =
        room === "evolution" ? poses.evolution() : room === "hall" ? poses.hall() : poses.legacy();
      useCameraStore.getState().go(pose, { durationMs: reducedGlide() });
      return;
    }
    const pose = !entered
      ? poses.landing(bay)
      : section === "engineering"
        ? exploded
          ? poses.engineeringExploded(bay)
          : poses.engineering(bay)
        : poses.bay(bay);
    // Next or previous bay: a short glide, its sound starting with the motion
    // once the new car is on screen.
    useCameraStore
      .getState()
      .go(pose, bayChanged && entered ? { durationMs: bayGlide(), onStart: playTransition } : {});
  }, [entered, room, bay, section, exploded, partFocus, viewResets, touring, legacyYear, hallFocus]);
}
