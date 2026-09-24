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

const relative = (bay: number, position: Vec3, target: Vec3): CameraPose => {
  const x = bayX(bay);
  return {
    position: [x + position[0], position[1], position[2]],
    target: [x + target[0], target[1], target[2]],
  };
};

export const poses = {
  /** Wide cinematic framing behind the landing copy. */
  landing: (bay: number) => relative(bay, [-6.5, 2.9, 8.3], [0, 0.5, 0]),
  /** Default driver-focus framing of the plinth. */
  bay: (bay: number) => relative(bay, [-6.3, 3.3, 8], [0.2, 0.95, -0.4]),
  /** Slightly closer and higher for technical study (spec §15.1). */
  // Panned so the car sits left of the component panel.
  engineering: (bay: number) => relative(bay, [-4.2, 3.8, 7], [1.2, 0.4, 0.85]),
  /** Pulled back down the corridor, looking into the bay. */
  corridor: (bay: number) => relative(bay, [-14, 4.2, 11], [1, 0.4, -0.5]),
  /** Threshold between the previous bay and this chapter. */
  chapterEntrance: (bay: number) => relative(bay, [-10.5, 2.6, 7.5], [-1, 1, -1]),
  /** Facing the bay's name wall. */
  identity: (bay: number) => relative(bay, [-1.2, 2.9, 4.6], [0, 2.3, -3.7]),
  /** Low three-quarter front view of the car. */
  carReveal: (bay: number) => relative(bay, [-5.2, 1.2, 4.4], [0.2, 0.5, 0]),
  /** Close on the helmet pedestal (front-right of the plinth). */
  helmet: (bay: number) => relative(bay, [2.0, 1.75, 3.4], [3.75, 1.3, 1.5]),
  /** Close study of one component, approached from its end of the car. */
  part: (bay: number, part: readonly number[]) => {
    const rear = part[0] > 0.5;
    return relative(
      bay,
      [part[0] + (rear ? 3.2 : -3.2), part[1] + 2, part[2] + 3.4],
      [part[0], part[1], part[2]],
    );
  },
};
