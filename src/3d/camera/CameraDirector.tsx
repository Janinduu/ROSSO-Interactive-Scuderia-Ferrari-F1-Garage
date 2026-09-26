import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import type { OrbitControls as OrbitType } from "three-stdlib";
import { useCameraStore } from "./cameraStore";
import type { RoomBounds } from "./poses";

const MIN_DISTANCE = 4;
const MAX_DISTANCE = 12;
/** How far round the visitor may swing from straight in front of the room. */
const MAX_AZIMUTH = 1.35;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

interface Transition {
  id: number;
  fromPosition: Vector3;
  fromTarget: Vector3;
  toPosition: Vector3;
  toTarget: Vector3;
  start: number;
  /** Frames rendered before the clock starts (absorbs a new car being built). */
  primed: number;
  duration: number;
  onStart?: () => void;
}

// The single owner of camera motion (spec §17). It eases between requested
// poses, reports arrival, and yields to the visitor when they grab the orbit
// controls — unless the request is locked by the guided tour.
export default function CameraDirector({
  enabled,
  enablePan,
  reduced,
  bounds,
}: {
  enabled: boolean;
  enablePan: boolean;
  reduced: boolean;
  /** Keeps the visitor inside the room. */
  bounds: RoomBounds | null;
}) {
  const controls = useRef<OrbitType>(null);
  const transition = useRef<Transition | null>(null);
  const { camera, invalidate } = useThree();
  const pose = useCameraStore((s) => s.pose);
  const requestId = useCameraStore((s) => s.requestId);
  const options = useCameraStore((s) => s.options);
  const transitioning = useCameraStore((s) => s.transitioning);
  const settle = useCameraStore((s) => s.settle);
  const setDirectorMounted = useCameraStore((s) => s.setDirectorMounted);

  useEffect(() => {
    setDirectorMounted(true);
    return () => setDirectorMounted(false);
  }, [setDirectorMounted]);

  useLayoutEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    const toPosition = new Vector3(...pose.position);
    const toTarget = new Vector3(...pose.target);
    const travel =
      camera.position.distanceTo(toPosition) + orbit.target.distanceTo(toTarget);
    const duration = reduced
      ? 0
      : (options.durationMs ??
        Math.min(2400, Math.max(700, 650 + travel * 110)));
    transition.current = {
      id: requestId,
      fromPosition: camera.position.clone(),
      fromTarget: orbit.target.clone(),
      toPosition,
      toTarget,
      start: -1,
      primed: 0,
      duration,
      onStart: options.onStart,
    };
    invalidate();
    // Only a new request starts a transition; pose/options arrive with it.
  }, [requestId]);

  useFrame(() => {
    const move = transition.current;
    const orbit = controls.current;
    if (!orbit) return;
    if (!move) {
      if (bounds) clampToRoom();
      return;
    }
    // Hold the first frame: anything new in the scene (a car, its textures)
    // is built and uploaded there, and the glide then starts cleanly with its
    // sound instead of jumping ahead.
    if (move.start < 0 && move.primed < 1 && move.duration > 0) {
      move.primed++;
      invalidate();
      return;
    }
    const now = performance.now();
    if (move.start < 0) {
      move.start = now;
      move.onStart?.();
    }
    const t = move.duration <= 0 ? 1 : Math.min(1, (now - move.start) / move.duration);
    const eased = easeInOutCubic(t);
    camera.position.lerpVectors(move.fromPosition, move.toPosition, eased);
    orbit.target.lerpVectors(move.fromTarget, move.toTarget, eased);
    orbit.update();
    if (t >= 1) {
      transition.current = null;
      settle(move.id);
    } else invalidate();
  });

  // Keep the camera between the walls, in front of the backdrop and below the
  // top of the walls. The box widens to hold the authored pose, so a framing
  // the museum chose itself is never pushed.
  const lo = new Vector3();
  const hi = new Vector3();
  function clampToRoom() {
    if (!bounds) return;
    const [px, py, pz] = pose.position;
    lo.set(Math.min(bounds.min[0], px), Math.min(bounds.min[1], py), Math.min(bounds.min[2], pz));
    hi.set(Math.max(bounds.max[0], px), Math.max(bounds.max[1], py), Math.max(bounds.max[2], pz));
    const p = camera.position;
    if (p.x < lo.x || p.y < lo.y || p.z < lo.z || p.x > hi.x || p.y > hi.y || p.z > hi.z) {
      p.clamp(lo, hi);
      controls.current?.update();
    }
  }
  // Swinging round is limited to the front of the room, unless the authored
  // pose itself looks from behind (a rear component study).
  const poseAzimuth = Math.atan2(
    pose.position[0] - pose.target[0],
    pose.position[2] - pose.target[2],
  );
  const azimuthFree = Math.abs(poseAzimuth) > MAX_AZIMUTH - 0.05;

  // Authored poses may sit outside the visitor's zoom range; widen the limits
  // just enough to hold them so OrbitControls does not snap the camera.
  const poseDistance = new Vector3(...pose.position).distanceTo(
    new Vector3(...pose.target),
  );
  const moving = transitioning;
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={enabled && !(moving && options.lock)}
      enablePan={enablePan}
      enableZoom
      minDistance={moving ? 0 : Math.min(MIN_DISTANCE, poseDistance)}
      maxDistance={moving ? Infinity : Math.max(MAX_DISTANCE, poseDistance)}
      minAzimuthAngle={transitioning || azimuthFree ? -Infinity : -MAX_AZIMUTH}
      maxAzimuthAngle={transitioning || azimuthFree ? Infinity : MAX_AZIMUTH}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI / 2 - 0.04}
      enableDamping
      dampingFactor={0.12}
      onStart={() => {
        const move = transition.current;
        if (move && !options.lock) {
          transition.current = null;
          settle(move.id);
        }
      }}
    />
  );
}
