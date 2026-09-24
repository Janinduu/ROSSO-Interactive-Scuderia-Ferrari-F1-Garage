import type { PartId } from "../../data/engineering";
import type { CarSpec } from "./families";

export type Anchor = [number, number, number];

/** Display scale applied to every car on its plinth (see Garage). */
export const CAR_SCALE = 1.12;

// Where each engineering component sits on a given car, for hotspots and the
// component camera. A component the car does not have returns no anchor.
export function anchorsFor(spec: CarSpec): Partial<Record<PartId, Anchor>> {
  const raw = rawAnchors(spec);
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, v.map((n) => n * CAR_SCALE) as Anchor]),
  );
}

function rawAnchors(spec: CarSpec): Partial<Record<PartId, Anchor>> {
  const a: Partial<Record<PartId, Anchor>> = {
    tyres: [spec.frontAxle, spec.tyreF.r + 0.05, spec.trackF + spec.tyreF.w / 2],
    brakes: [spec.rearAxle, spec.tyreR.r, spec.trackR - spec.tyreR.w / 2 - 0.06],
    steering: [spec.cockpit.x0 + 0.1, spec.cockpit.y + 0.06, 0],
  };
  a["power-unit"] = spec.engineFront
    ? [spec.frontAxle + 0.4, spec.tub[3].y + spec.tub[3].h, 0]
    : spec.exposedEngine
      ? [(spec.exposedEngine.x0 + spec.exposedEngine.x1) / 2, spec.exposedEngine.y + spec.exposedEngine.h + 0.05, 0]
      : spec.cover
        ? [spec.cover[2].x, spec.cover[2].y + spec.cover[2].h, 0]
        : [spec.rearAxle - 0.5, 0.7, 0];
  if (spec.frontWing)
    a["front-wing"] = [spec.frontWing.x, spec.frontWing.y + 0.06, spec.frontWing.span * 0.36];
  if (spec.rearWing) a["rear-wing"] = [spec.rearWing.x, spec.rearWing.y + 0.05, spec.rearWing.span * 0.3];
  if (spec.floor) a.floor = [(spec.floor.x0 + spec.floor.x1) / 2, 0.08, spec.floor.w + 0.02];
  if (spec.diffuser)
    a.diffuser = [spec.diffuser.x1 - 0.12, 0.08 + spec.diffuser.rise * 0.8, spec.diffuser.w * 0.6];
  if (spec.pods)
    a.sidepods = [spec.pods.x0 + 0.35, spec.pods.y + spec.pods.h * 0.8, spec.pods.z + spec.pods.w * 0.7];
  return a;
}
