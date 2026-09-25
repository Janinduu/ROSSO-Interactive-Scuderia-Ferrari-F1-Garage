import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { Vector3 } from "three";
import type { Group } from "three";
import CarModel from "../3d/cars/CarModel";
import { anchorsFor, CAR_SCALE } from "../3d/cars/anchors";
import ExplodeRig from "../3d/cars/ExplodeRig";
import EvolutionRoom from "../3d/rooms/EvolutionRoom";
import { milestones, milestoneAt, useEvolutionStore, yearAt } from "../features/evolution/evolution";
import { useMuseumStore } from "../stores/museumStore";
import { explodedOffset } from "../3d/cars/explode";
import type { ResolvedCar } from "../data/cars";
import type { HelmetDesign } from "../3d/helmets/helmetArt";
import Corridor from "../3d/bays/Corridor";
import CameraDirector from "../3d/camera/CameraDirector";
import { useCameraStore } from "../3d/camera/cameraStore";
import { bayX } from "../3d/camera/poses";
import { parts } from "../data/engineering";
import type { PartId } from "../data/engineering";
import type { Driver } from "../data/drivers";

function Set({
  bay,
  high,
  landing,
  explore,
  reduced,
  onSelectDriver,
  car,
  helmet,
  exploded,
  isolate,
  selected,
  engineering,
}: {
  car: ResolvedCar;
  helmet: HelmetDesign;
  exploded: boolean;
  isolate: boolean;
  selected: PartId | null;
  engineering: boolean;
  bay: number;
  high: boolean;
  landing: boolean;
  explore: boolean;
  reduced: boolean;
  onSelectDriver: (index: number) => void;
}) {
  const x = bayX(bay);
  const carRef = useRef<Group>(null);
  const inEvolution = useMuseumStore((s) => s.entered && s.room === "evolution");
  // Subscribe to the year and car only, not the clock, so the scene
  // re-renders about once a second while the sequence plays.
  const evoYear = useEvolutionStore((s) => yearAt(s.elapsed));
  const milestone = milestones[useEvolutionStore((s) => milestoneAt(s.elapsed))];
  return (
    <>
      <color attach="background" args={["#101112"]} />
      <fog attach="fog" args={["#101112", 13, 36]} />
      <ambientLight intensity={0.8} />
      <hemisphereLight args={["#e3e5eb", "#303039", 1.8]} />
      {/* The selected bay is lit; the rest of the corridor falls back. */}
      <directionalLight
        position={[x - 3, 7, 5]}
        intensity={3.5}
        color="#fff1df"
        castShadow={high}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <pointLight
        position={[x + 3, 2, -3]}
        intensity={13}
        color="#eb3039"
        distance={10}
      />
      <pointLight
        position={[x - 4, 4, -1]}
        intensity={25}
        color="#dce8ff"
        distance={12}
      />
      <Corridor current={bay} onSelect={onSelectDriver} />
      {/* Only the selected bay holds a detailed car (spec §11.3). */}
      {/* Slightly larger than life so the car holds the plinth. */}
      <EvolutionRoom year={evoYear} milestone={milestone} active={inEvolution} reduced={reduced} />
      {/* One detailed car at a time: the bay car steps aside in the Evolution room. */}
      <group ref={carRef} position={[x, 0.02, 0]} scale={CAR_SCALE} visible={!inEvolution}>
        {!inEvolution && (
          <CarModel
            key={car.id}
            spec={car.spec}
            helmet={helmet}
            livery={car.livery}
            number={car.raceNumber}
          />
        )}
      </group>
      <ExplodeRig
        root={carRef}
        exploded={exploded}
        selected={engineering ? selected : null}
        isolate={isolate}
        reduced={reduced}
        carKey={car.id}
      />
      <ContactShadows
        key={`${bay}-${high}`}
        position={[x, 0.001, 0]}
        opacity={0.65}
        scale={9}
        blur={2.2}
        far={3}
        resolution={high ? 512 : 256}
        frames={1}
        color="#000000"
      />
      <CameraDirector
        enabled={!landing}
        enablePan={explore}
        reduced={reduced}
      />
    </>
  );
}
export default function Garage(props: {
  driver: Driver;
  bay: number;
  high: boolean;
  landing: boolean;
  engineering: boolean;
  onPart: (id: PartId) => void;
  selected: PartId | null;
  explore: boolean;
  reduced: boolean;
  onFailure: () => void;
  onSelectDriver: (index: number) => void;
  car: ResolvedCar;
  helmet: HelmetDesign;
  exploded: boolean;
  isolate: boolean;
}) {
  const [ready, setReady] = useState(false);
  const { available, anchorList } = useMemo(() => {
    const anchors = anchorsFor(props.car.spec);
    const available = parts.filter((p) => anchors[p.id]);
    return {
      available,
      anchorList: available.map((p) => ({ id: p.id, at: anchors[p.id]! })),
    };
  }, [props.car.spec]);
  const markers = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div
      className={`canvas-wrap ${ready ? "ready" : ""}`}
      aria-label="Interactive original open-wheel race car in a museum garage"
    >
      {!ready && (
        <div className="scene-loading">
          <span />
          Lighting the garage…
        </div>
      )}
      <Canvas
        key={props.high ? "high" : "performance"}
        shadows={props.high}
        frameloop="demand"
        dpr={props.high ? [1, 1.5] : [0.8, 1]}
        camera={{
          // Start where the director will be, so a quality switch does not jump.
          position: useCameraStore.getState().pose.position,
          fov: 40,
          near: 0.1,
          far: 80,
        }}
        gl={{
          antialias: props.high,
          alpha: false,
          powerPreference: "low-power",
        }}
        onCreated={() => setReady(true)}
        fallback={<div>3D unavailable. Open settings for the 2D archive.</div>}
      >
        <ContextGuard onFailure={props.onFailure} />
        <ProjectHotspots
          markers={markers}
          bay={props.bay}
          visible={props.engineering}
          anchors={anchorList}
        />
        <Suspense fallback={null}>
          <Set {...props} />
        </Suspense>
      </Canvas>
      {props.engineering && (
        <div className="hotspot-layer">
          {available.map((p, i) => (
            <button
              key={p.id}
              ref={(el) => {
                markers.current[i] = el;
              }}
              className={`hotspot ${props.selected === p.id ? "selected" : ""}`}
              hidden={
                props.isolate && !!props.selected && props.selected !== p.id
              }
              aria-label={`Inspect ${p.name}`}
              onClick={() => props.onPart(p.id)}
            >
              {String(parts.indexOf(p) + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function ContextGuard({ onFailure }: { onFailure: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      onFailure();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  return null;
}
function ProjectHotspots({
  markers,
  bay,
  visible,
  anchors,
}: {
  markers: { current: (HTMLButtonElement | null)[] };
  bay: number;
  visible: boolean;
  anchors: { id: PartId; at: [number, number, number] }[];
}) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [visible, bay, anchors, invalidate]);
  const point = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    if (!visible) return;
    // Hotspots ride along with their components in the exploded view.
    anchors.forEach(({ id, at }, i) => {
      const marker = markers.current[i];
      if (!marker) return;
      const o = explodedOffset(id);
      point
        .set(
          at[0] + o[0] * CAR_SCALE + bayX(bay),
          at[1] + o[1] * CAR_SCALE + 0.02,
          at[2] + o[2] * CAR_SCALE,
        )
        .project(camera);
      marker.style.left = `${(point.x * 0.5 + 0.5) * size.width}px`;
      marker.style.top = `${(-point.y * 0.5 + 0.5) * size.height}px`;
      marker.style.visibility =
        point.z > 1 || point.z < -1 ? "hidden" : "visible";
    });
  });
  return null;
}
