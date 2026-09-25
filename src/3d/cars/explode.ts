import type { PartId } from "../../data/engineering";

type V3 = [number, number, number];

// Exploded view (spec §12): deterministic, authored offsets for each named
// component group, in the car's local units. The chassis never moves.
// Groups start in sequence so the car opens up rather than bursting apart.
export const EXPLODE: Record<string, { offset: V3; delay: number }> = {
  front_wing: { offset: [-0.95, -0.02, 0], delay: 0 },
  front_wing_supports: { offset: [-0.7, 0, 0], delay: 0 },
  rear_wing: { offset: [0.85, 0.45, 0], delay: 0.05 },
  rear_wing_supports: { offset: [0.6, 0.2, 0], delay: 0.05 },
  beam_wing: { offset: [0.7, 0.12, 0], delay: 0.05 },
  tyre_fl: { offset: [-0.08, 0, 0.8], delay: 0.1 },
  tyre_fr: { offset: [-0.08, 0, -0.8], delay: 0.1 },
  tyre_rl: { offset: [0.08, 0, 0.8], delay: 0.12 },
  tyre_rr: { offset: [0.08, 0, -0.8], delay: 0.12 },
  brake_fl: { offset: [-0.04, 0, 0.36], delay: 0.14 },
  brake_fr: { offset: [-0.04, 0, -0.36], delay: 0.14 },
  brake_rl: { offset: [0.04, 0, 0.36], delay: 0.16 },
  brake_rr: { offset: [0.04, 0, -0.36], delay: 0.16 },
  sidepod_left: { offset: [0, 0.25, 0.9], delay: 0.18 },
  sidepod_right: { offset: [0, 0.25, -0.9], delay: 0.18 },
  panniers: { offset: [0, 0.4, 0], delay: 0.18 },
  bargeboards: { offset: [-0.3, 0.22, 0], delay: 0.2 },
  floor: { offset: [0, 0.035, 0], delay: 0.22 },
  diffuser: { offset: [0.65, 0.08, 0], delay: 0.24 },
  engine_cover: { offset: [0.15, 1.25, 0], delay: 0.26 },
  airbox: { offset: [0, 1.1, 0], delay: 0.26 },
  halo: { offset: [0, 0.55, 0], delay: 0.28 },
  power_unit_proxy: { offset: [0, 0.62, 0], delay: 0.32 },
  steering_wheel: { offset: [-0.18, 0.45, 0], delay: 0.34 },
};

/** Share of the timeline taken by the longest delay. */
const SPREAD = 0.34;
export const EXPLODE_MS = 1100;

const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/** How far a group has travelled at overall progress p (0..1). */
export function groupProgress(name: string, p: number) {
  const d = EXPLODE[name]?.delay ?? 0;
  return ease(Math.min(1, Math.max(0, (p - d) / (1 - SPREAD))));
}

/** The named groups that make up each engineering component. */
export const PART_GROUPS: Record<PartId, string[]> = {
  "front-wing": ["front_wing", "front_wing_supports"],
  "rear-wing": ["rear_wing", "rear_wing_supports", "beam_wing"],
  tyres: ["tyre_fl", "tyre_fr", "tyre_rl", "tyre_rr"],
  brakes: ["brake_fl", "brake_fr", "brake_rl", "brake_rr"],
  "power-unit": ["power_unit_proxy"],
  steering: ["steering_wheel"],
  floor: ["floor"],
  diffuser: ["diffuser"],
  sidepods: ["sidepod_left", "sidepod_right"],
};

/** The group whose motion a component's hotspot follows. */
export const ANCHOR_GROUP: Record<PartId, string> = {
  "front-wing": "front_wing",
  "rear-wing": "rear_wing",
  tyres: "tyre_fl",
  brakes: "brake_rl",
  "power-unit": "power_unit_proxy",
  steering: "steering_wheel",
  floor: "floor",
  diffuser: "diffuser",
  sidepods: "sidepod_left",
};

/** Live explode progress, shared by the rig and the hotspot projection. */
export const explodeState = { progress: 0 };

/** Where an anchor sits once its group has moved, in the car's local units. */
export function explodedOffset(part: PartId, p = explodeState.progress): V3 {
  const name = ANCHOR_GROUP[part];
  const o = EXPLODE[name]?.offset ?? [0, 0, 0];
  const k = groupProgress(name, p);
  return [o[0] * k, o[1] * k, o[2] * k];
}
