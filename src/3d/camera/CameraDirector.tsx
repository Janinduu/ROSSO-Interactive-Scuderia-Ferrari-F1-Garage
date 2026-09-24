import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import type { OrbitControls as OrbitType } from "three-stdlib";
import { useCameraStore } from "./cameraStore";

const MIN_DISTANCE = 4;
const MAX_DISTANCE = 12;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

interface Transition {
  id: number;
  fromPosition: Vector3;
  fromTarget: Vector3;
  toPosition: Vector3;
  toTarget: Vector3;
  start: number;
  duration: number;
}

// The single owner of camera motion (spec §17). It eases between requested
// poses, reports arrival, and yields to the visitor when they grab the orbit
// controls — unless the request is locked by the guided tour.
export default function CameraDirector({
  enabled,
  enablePan,
  reduced,
}: {
  enabled: boolean;
  enablePan: boolean;
  reduced: boolean;
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
      duration,
    };
    invalidate();
    // Only a new request starts a transition; pose/options arrive with it.
  }, [requestId]);

  useFrame(() => {
    const move = transition.current;
    const orbit = controls.current;
    if (!move || !orbit) return;
    const now = performance.now();
    if (move.start < 0) move.start = now;
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
