import { create } from "zustand";
import { poses } from "./poses";
import type { CameraPose } from "./poses";

export interface CameraRequestOptions {
  /** Fixed duration. Omit for a distance-based duration. */
  durationMs?: number;
  /** Disable manual orbit while this transition runs (guided tour). */
  lock?: boolean;
}

interface CameraState {
  pose: CameraPose;
  requestId: number;
  arrivedId: number;
  options: CameraRequestOptions;
  transitioning: boolean;
  directorMounted: boolean;
  /** Ask the CameraDirector to move to a pose. Returns the request id. */
  go: (pose: CameraPose, options?: CameraRequestOptions) => number;
  /** Called by the director when a request finishes or is interrupted. */
  settle: (id: number) => void;
  setDirectorMounted: (mounted: boolean) => void;
}

// Components never animate the camera themselves: they request a pose here and
// the CameraDirector inside the canvas performs the move (spec §17).
export const useCameraStore = create<CameraState>((set, get) => ({
  pose: poses.landing(10),
  requestId: 0,
  arrivedId: 0,
  options: {},
  transitioning: false,
  directorMounted: false,
  go: (pose, options = {}) => {
    const requestId = get().requestId + 1;
    // Without a 3D scene (2D archive, WebGL failure) every move is instant, so
    // anything waiting on arrival — like the guided tour — keeps working.
    const instant = !get().directorMounted;
    set({
      pose,
      options,
      requestId,
      transitioning: !instant,
      ...(instant ? { arrivedId: requestId } : {}),
    });
    return requestId;
  },
  settle: (id) =>
    set((s) =>
      id >= s.arrivedId
        ? { arrivedId: id, transitioning: id < s.requestId }
        : {},
    ),
  setDirectorMounted: (directorMounted) =>
    set((s) =>
      directorMounted
        ? { directorMounted }
        : { directorMounted, arrivedId: s.requestId, transitioning: false },
    ),
}));
