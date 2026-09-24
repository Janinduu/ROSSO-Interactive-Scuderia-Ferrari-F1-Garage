import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { CanvasTexture, Vector3, SRGBColorSpace } from "three";
import type { OrbitControls as OrbitType } from "three-stdlib";
import Car from "./Car";
import { parts } from "../data/engineering";
import type { PartId } from "../data/engineering";
import type { Driver } from "../data/drivers";

function WallLabel({
  text,
  position,
}: {
  text: string;
  position: [number, number, number];
}) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#d4d2cb";
    ctx.font = "500 65px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text.toUpperCase(), 512, 140);
    ctx.fillStyle = "#a1242b";
    ctx.fillRect(432, 193, 160, 3);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position}>
      <planeGeometry args={[5, 1.25]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
function CameraRig({
  bay,
  landing,
  reset,
  explore,
  reduced,
}: {
  bay: number;
  landing: boolean;
  reset: number;
  explore: boolean;
  reduced: boolean;
}) {
  const ref = useRef<OrbitType>(null);
  const { camera, invalidate } = useThree();
  const anim = useRef(true);
  useEffect(() => {
    anim.current = true;
    invalidate();
  }, [bay, landing, reset, invalidate]);
  useFrame((_, dt) => {
    if (!ref.current || !anim.current) return;
    const target = new Vector3(bay * 9, 0.5, 0);
    const end = new Vector3(
      bay * 9 - (landing ? 6.5 : 5.9),
      landing ? 2.9 : 3.2,
      landing ? 8.3 : 7.3,
    );
    const t = reduced ? 1 : 1 - Math.exp(-dt * 4);
    camera.position.lerp(end, t);
    ref.current.target.lerp(target, t);
    ref.current.update();
    if (camera.position.distanceTo(end) < 0.01) {
      anim.current = false;
    } else invalidate();
  });
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enabled={!landing}
      enablePan={explore}
      enableZoom
      minDistance={4}
      maxDistance={12}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI / 2 - 0.04}
      enableDamping
      dampingFactor={0.12}
      onStart={() => {
        anim.current = false;
      }}
    />
  );
}
function Set({
  bay,
  driver,
  high,
  landing,
  reset,
  explore,
  reduced,
}: {
  bay: number;
  driver: Driver;
  high: boolean;
  landing: boolean;
  reset: number;
  explore: boolean;
  reduced: boolean;
}) {
  const x = bay * 9;
  return (
    <>
      <color attach="background" args={["#101112"]} />
      <fog attach="fog" args={["#101112", 13, 36]} />
      <ambientLight intensity={0.8} />
      <hemisphereLight args={["#e3e5eb", "#303039", 1.8]} />
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
      <mesh
        position={[x, -0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[90, 45]} />
        <meshStandardMaterial
          color="#24262a"
          metalness={high ? 0.65 : 0.3}
          roughness={high ? 0.32 : 0.68}
        />
      </mesh>
      {[-1, 0, 1].map((i) => (
        <group key={i} position={[x + i * 9, 0, 0]}>
          <mesh position={[0, 2.5, -4]}>
            <boxGeometry args={[8.92, 5, 0.2]} />
            <meshStandardMaterial
              color="#1d2024"
              metalness={0.55}
              roughness={0.48}
            />
          </mesh>
          {[-4.4, 4.4].map((a) => (
            <mesh key={a} position={[a, 2.5, -3.85]}>
              <boxGeometry args={[0.13, 5, 0.3]} />
              <meshStandardMaterial
                color="#34363b"
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
          ))}
          {[1, 2, 3, 4].map((y) => (
            <mesh key={y} position={[0, y, -3.86]}>
              <boxGeometry args={[8.7, 0.014, 0.025]} />
              <meshBasicMaterial color="#36383b" />
            </mesh>
          ))}
          <mesh position={[0, 0.02, -2.5]}>
            <boxGeometry args={[7.8, 0.025, 0.024]} />
            <meshBasicMaterial color="#be252e" />
          </mesh>
          {[-3.9, 3.9].map((z) => (
            <mesh key={z} position={[z, 0.015, 0]}>
              <boxGeometry args={[0.025, 0.015, 5]} />
              <meshBasicMaterial color="#733137" />
            </mesh>
          ))}
          <mesh position={[0, 4.7, 0]}>
            <boxGeometry args={[6.4, 0.025, 0.16]} />
            <meshBasicMaterial color="#eeeae0" />
          </mesh>
          <mesh position={[0, 4.7, -2.3]}>
            <boxGeometry args={[6.4, 0.025, 0.12]} />
            <meshBasicMaterial color="#aaa9a0" />
          </mesh>
          <mesh position={[0, 0.015, 0]}>
            <cylinderGeometry args={[3.15, 3.15, 0.025, 72]} />
            <meshStandardMaterial
              color="#33353a"
              roughness={0.6}
              metalness={0.35}
            />
          </mesh>
        </group>
      ))}
      <WallLabel
        text={landing ? "Passione. Senza fine." : driver.name}
        position={[x, 2.85, -3.72]}
      />
      <group position={[x, 0.04, 0]}>
        <Car era={driver.model} />
      </group>
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
      <CameraRig
        bay={bay}
        landing={landing}
        reset={reset}
        explore={explore}
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
  reset: number;
  explore: boolean;
  reduced: boolean;
  onFailure: () => void;
}) {
  const [ready, setReady] = useState(false);
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
          position: [props.bay * 9 - 6.5, 2.9, 8.3],
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
        />
        <Suspense fallback={null}>
          <Set {...props} />
        </Suspense>
      </Canvas>
      {props.engineering && (
        <div className="hotspot-layer">
          {parts.map((p, i) => (
            <button
              key={p.id}
              ref={(el) => {
                markers.current[i] = el;
              }}
              className={`hotspot ${props.selected === p.id ? "selected" : ""}`}
              aria-label={`Inspect ${p.name}`}
              onClick={() => props.onPart(p.id)}
            >
              {String(i + 1).padStart(2, "0")}
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
}: {
  markers: { current: (HTMLButtonElement | null)[] };
  bay: number;
  visible: boolean;
}) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [visible, bay, invalidate]);
  const point = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    if (!visible) return;
    parts.forEach((p, i) => {
      const marker = markers.current[i];
      if (!marker) return;
      point
        .set(p.position[0] + bay * 9, p.position[1] + 0.04, p.position[2])
        .project(camera);
      marker.style.left = `${(point.x * 0.5 + 0.5) * size.width}px`;
      marker.style.top = `${(-point.y * 0.5 + 0.5) * size.height}px`;
      marker.style.visibility =
        point.z > 1 || point.z < -1 ? "hidden" : "visible";
    });
  });
  return null;
}
