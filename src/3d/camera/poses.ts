// Named camera poses (spec §17). Every pose is expressed relative to a bay so
// the same framing works for any driver. The car points towards -X, Y is up and
// the bay's back wall sits at z = -4.
export type Vec3 = [number, number, number];
export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

export const BAY_SPACING = 9;
export const bayX = (bay: number) => bay * BAY_SPACING;
/** The Evolution room sits before the first bay. */
export const EVOLUTION_X = -15;
/** The Hall of Champions closes the corridor, after the last bay. */
export const HALL_X = 17 * BAY_SPACING + 8;
/** The Legacy room lies beyond the Hall of Champions. */
export const LEGACY_X = HALL_X + 34;

const relative = (bay: number, position: Vec3, target: Vec3): CameraPose => {
  const x = bayX(bay);
  return {
    position: [x + position[0], position[1], position[2]],
    target: [x + target[0], target[1], target[2]],
  };
};

export const poses = {
  /** Close on one champion's station in the Hall, from in front of it. */
  hallStation: (p: { x: number; z: number; ry: number }): CameraPose => ({
    position: [p.x + Math.sin(p.ry) * 5.4 - Math.cos(p.ry) * 1.3, 3.1, p.z + Math.cos(p.ry) * 5.4 + Math.sin(p.ry) * 1.3],
    target: [p.x, 1.25, p.z],
  }),
  /** The Legacy room from its entrance, framed right of the panel. */
  legacy: (): CameraPose => ({
    position: [LEGACY_X - 7.5, 3.6, 12.5],
    target: [LEGACY_X - 1.2, 2.6, -2.4],
  }),
  /** Close on one constructors' trophy. */
  legacyTrophy: (p: { x: number; y: number; z: number }): CameraPose => ({
    position: [p.x - 1.9, p.y + 2.1, p.z + 4.2],
    target: [p.x + 0.5, p.y + 1.3, p.z],
  }),
  /** The Hall of Champions from its entrance. */
  hall: (): CameraPose => ({
    // Off-centre, so the whole arc sits clear of the panel on the left.
    position: [HALL_X - 9, 4.8, 15.6],
    target: [HALL_X - 1.9, 1.5, -1.6],
  }),
  /** Facing the Evolution room's turntable and year wall. */
  evolution: (): CameraPose => ({
    // Looking slightly left of centre keeps the wall clear of the panel.
    position: [EVOLUTION_X - 8.4, 3.2, 8.4],
    target: [EVOLUTION_X - 2.6, 1.2, -0.8],
  }),
  /** Wide cinematic framing behind the landing copy. */
  landing: (bay: number) => relative(bay, [-6.5, 2.9, 8.3], [0, 0.5, 0]),
  /** Default driver-focus framing of the plinth. */
  bay: (bay: number) => relative(bay, [-6.3, 3.3, 8], [0.2, 0.95, -0.4]),
  /** Slightly closer and higher for technical study (spec §15.1). */
  // Panned so the car sits left of the component panel.
  engineering: (bay: number) => relative(bay, [-4.2, 3.8, 7], [1.2, 0.4, 0.85]),
  /** Wider technical framing while the car is exploded. */
  engineeringExploded: (bay: number) =>
    relative(bay, [-6.5, 5.7, 10.5], [1.7, 0.7, 1.3]),
  /** Pulled back down the corridor, looking into the bay. */
  corridor: (bay: number) => relative(bay, [-14, 4.2, 11], [1, 0.4, -0.5]),
  /** Threshold between the previous bay and this chapter. */
  chapterEntrance: (bay: number) =>
    relative(bay, [-10.5, 2.6, 7.5], [-1, 1, -1]),
  /** Facing the bay's name wall. */
  identity: (bay: number) => relative(bay, [-1.2, 2.9, 4.6], [0, 2.3, -3.7]),
  /** Low three-quarter front view of the car. */
  carReveal: (bay: number) => relative(bay, [-5.2, 1.2, 4.4], [0.2, 0.5, 0]),
  /** Close on the helmet pedestal (front-right of the plinth). */
  helmet: (bay: number) => relative(bay, [2.0, 1.75, 3.4], [3.75, 1.3, 1.5]),
  /** Close study of one component, approached from its end of the car. */
  // Rear components are seen from the back-wall side, so the helmet pedestal
  // (front-right of the plinth) never stands between camera and car.
  part: (bay: number, part: readonly number[]) => {
    const rear = part[0] > 0.5;
    return relative(
      bay,
      rear
        ? [part[0] + 2.3, part[1] + 2.3, Math.min(part[2] - 2.9, -2.4)]
        : [part[0] - 3.2, part[1] + 2, part[2] + 3.4],
      // Keep the assembly in the visible space beside the existing controls.
      rear
        ? [part[0] - 0.7, part[1], part[2] - 0.55]
        : [part[0] + 0.65, part[1], part[2] + 0.61],
    );
  },
};
