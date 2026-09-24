import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import {
  BoxGeometry,
  CylinderGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import type { BufferGeometry, Material, Texture } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { studioEnvironment } from "../studio";
import { aerofoil, loft, tube, tyre } from "./geometry";
import type { Ring } from "./geometry";
import type { CarSpec, WingSpec } from "./families";
import Helmet from "../helmets/Helmet";
import type { HelmetDesign } from "../helmets/helmetArt";

type V3 = [number, number, number];

function useMaterials(env: Texture) {
  const mats = useMemo(() => {
    const paint = new MeshPhysicalMaterial({
      color: "#a50c14",
      roughness: 0.34,
      metalness: 0.05,
      clearcoat: 0.55,
      clearcoatRoughness: 0.12,
      envMap: env,
      envMapIntensity: 0.32,
    });
    const std = (color: string, roughness: number, metalness: number, envMapIntensity = 0.6) =>
      new MeshStandardMaterial({ color, roughness, metalness, envMap: env, envMapIntensity });
    return {
      paint,
      accent: new MeshPhysicalMaterial({
        color: "#ece8df",
        roughness: 0.35,
        clearcoat: 0.8,
        envMap: env,
        envMapIntensity: 0.7,
      }),
      carbon: std("#15161a", 0.42, 0.35),
      dark: std("#050506", 0.9, 0.1, 0.1),
      rubber: std("#141517", 0.82, 0.05, 0.25),
      groove: std("#08090a", 0.95, 0, 0),
      chrome: std("#d5d8dc", 0.12, 1, 1.2),
      rim: std("#8f949a", 0.25, 0.9, 1),
      graphite: std("#2b2d31", 0.3, 0.85, 0.9),
      engine: std("#6d7176", 0.35, 0.85, 0.8),
      brake: std("#2a2a2c", 0.6, 0.3),
      caliper: std("#8a1b20", 0.4, 0.5),
      helmet: std("#e9e5dc", 0.3, 0.2, 0.8),
      glass: new MeshPhysicalMaterial({
        color: "#cfd8df",
        roughness: 0.05,
        transparent: true,
        opacity: 0.28,
        envMap: env,
      }),
    };
  }, [env]);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  return mats;
}
type Mats = ReturnType<typeof useMaterials>;

/** Body width at a given x, interpolated from a loft. */
function widthAt(rings: Ring[], x: number) {
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i];
    const b = rings[i + 1];
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / (b.x - a.x);
      return { w: a.w + (b.w - a.w) * t, y: a.y + (b.y - a.y) * t, h: a.h + (b.h - a.h) * t };
    }
  }
  const r = x < rings[0].x ? rings[0] : rings[rings.length - 1];
  return { w: r.w, y: r.y, h: r.h };
}

function Rod({ a, b, material, radius = 0.014 }: { a: V3; b: V3; material: Material; radius?: number }) {
  const start = new Vector3(...a);
  const end = new Vector3(...b);
  const dir = end.clone().sub(start);
  return (
    <mesh
      position={start.clone().add(end).multiplyScalar(0.5)}
      quaternion={new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize())}
      material={material}
    >
      <cylinderGeometry args={[radius, radius, dir.length(), 6]} />
    </mesh>
  );
}

function Box({ size, position, rotation, material, cast = true }: {
  size: V3; position: V3; rotation?: V3; material: Material; cast?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow={cast}>
      <boxGeometry args={size} />
    </mesh>
  );
}

/** Geometry is created per spec and disposed when the car changes. */
function useGeometry<T extends Record<string, BufferGeometry | null>>(build: () => T, deps: unknown[]) {
  const g = useMemo(build, deps);
  useEffect(() => () => Object.values(g).forEach((x) => x?.dispose()), [g]);
  return g;
}

function Wing({
  wing,
  mats,
  material,
  name,
  plateBottom,
}: {
  wing: WingSpec;
  mats: Mats;
  material: Material;
  name: string;
  /** Absolute height the endplates extend down to (rear wings). */
  plateBottom?: number;
}) {
  const geos = useGeometry(() => {
    const out: Record<string, BufferGeometry> = {};
    let chord = wing.chord;
    for (let i = 0; i < wing.elements; i++) {
      out[`e${i}`] = aerofoil(chord, wing.span, 0.1, 0.08);
      chord *= 0.68;
    }
    return out;
  }, [wing]);
  const elements: { x: number; y: number; rake: number; chord: number }[] = [];
  let chord = wing.chord;
  let x = 0;
  let y = 0;
  for (let i = 0; i < wing.elements; i++) {
    elements.push({ x, y, rake: 0.08 + i * 0.22, chord });
    x += chord * 0.62;
    y += chord * 0.2;
    chord *= 0.68;
  }
  const total = x + chord;
  const plateLength = Math.max(wing.chord * 1.1, total);
  const plateHeight = plateBottom != null ? wing.y + 0.12 - plateBottom : wing.endplate;
  const plateY = plateBottom != null ? 0.12 - plateHeight / 2 : wing.endplate / 2 - 0.04;
  return (
    <group name={name} position={[wing.x, wing.y, 0]}>
      {elements.map((e, i) => (
        <mesh
          key={i}
          geometry={geos[`e${i}`]}
          material={i === 0 ? material : mats.carbon}
          position={[e.x, e.y, 0]}
          rotation={[0, 0, e.rake]}
          castShadow
        />
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            size={[plateLength, plateHeight, 0.012]}
            position={[plateLength / 2 - wing.chord / 2, plateY, (side * wing.span) / 2]}
            material={mats.carbon}
          />
          {wing.sweepUp && (
            <Box
              size={[wing.chord * 0.9, wing.sweepUp, 0.1]}
              position={[wing.chord * 0.2, wing.sweepUp / 2, side * (wing.span / 2 - 0.06)]}
              rotation={[side * 0.5, 0, 0]}
              material={material}
            />
          )}
        </group>
      ))}
    </group>
  );
}

function Wheel({ spec, front, side, mats }: { spec: CarSpec; front: boolean; side: 1 | -1; mats: Mats }) {
  const t = front ? spec.tyreF : spec.tyreR;
  const geos = useGeometry(() => {
    const spokes: BufferGeometry[] = [];
    if (spec.rim === "wire")
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        const len = spec.rimR - 0.05;
        const s = new CylinderGeometry(0.004, 0.004, len, 4);
        s.translate(0, len / 2 + 0.05, 0);
        s.rotateZ(a);
        s.translate(0, 0, (i % 2 ? 1 : -1) * 0.02);
        spokes.push(s);
      }
    if (spec.rim === "modern" || spec.rim === "cast")
      for (let i = 0; i < (spec.rim === "cast" ? 6 : 10); i++) {
        const s = new BoxGeometry(0.03, spec.rimR - 0.05, 0.02);
        s.translate(0, (spec.rimR - 0.05) / 2 + 0.04, 0);
        s.rotateZ((i / (spec.rim === "cast" ? 6 : 10)) * Math.PI * 2);
        spokes.push(s);
      }
    return {
      tyre: tyre(t.r, t.w, spec.rimR),
      spokes: spokes.length ? mergeGeometries(spokes) : null,
    };
  }, [spec.rim, spec.rimR, t.r, t.w]);
  const x = front ? spec.frontAxle : spec.rearAxle;
  const z = side * (front ? spec.trackF : spec.trackR);
  const outer = (side * t.w) / 2;
  const rimMat = spec.rim === "wire" ? mats.chrome : spec.rim === "cast" ? mats.rim : mats.graphite;
  const label = `${front ? "f" : "r"}${side < 0 ? "r" : "l"}`;
  return (
    <group position={[x, t.r, z]}>
      <group name={`tyre_${label}`}>
        <mesh geometry={geos.tyre} material={mats.rubber} castShadow />
        {spec.grooved &&
          [-0.3, -0.1, 0.1, 0.3].map((g) => (
            <mesh key={g} position={[0, 0, g * t.w]} material={mats.groove}>
              <torusGeometry args={[t.r + 0.001, 0.007, 4, 64]} />
            </mesh>
          ))}
        {/* Rim barrel and face. */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={rimMat}>
          <cylinderGeometry args={[spec.rimR, spec.rimR, t.w * 0.9, 32, 1, true]} />
        </mesh>
        <group position={[0, 0, outer * 0.86]}>
          {spec.wheelCovers ? (
            <mesh material={mats.carbon} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
              <circleGeometry args={[spec.rimR * 0.98, 40]} />
            </mesh>
          ) : (
            <>
              <mesh material={rimMat}>
                <torusGeometry args={[spec.rimR - 0.01, 0.014, 6, 40]} />
              </mesh>
              {geos.spokes && <mesh geometry={geos.spokes} material={rimMat} />}
            </>
          )}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={spec.rim === "wire" ? mats.chrome : mats.caliper}>
            <cylinderGeometry args={[0.045, 0.05, 0.05, 12]} />
          </mesh>
        </group>
      </group>
      <group name={`brake_${label}`} position={[0, 0, -side * t.w * 0.18]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.brake}>
          <cylinderGeometry args={[spec.rimR * 0.78, spec.rimR * 0.78, 0.03, 28]} />
        </mesh>
        <Box
          size={[0.07, 0.14, 0.06]}
          position={[spec.rimR * 0.55, spec.rimR * 0.45, 0]}
          material={mats.caliper}
          cast={false}
        />
      </group>
    </group>
  );
}

function Suspension({ spec, mats }: { spec: CarSpec; mats: Mats }) {
  const rods: [V3, V3][] = [];
  ([true, false] as const).forEach((front) => {
    const t = front ? spec.tyreF : spec.tyreR;
    const x = front ? spec.frontAxle : spec.rearAxle;
    const track = front ? spec.trackF : spec.trackR;
    const body = widthAt(spec.tub, Math.min(Math.max(x, spec.tub[0].x), spec.tub[spec.tub.length - 1].x));
    const inner = Math.max(0.12, body.w * 0.8);
    ([-1, 1] as const).forEach((side) => {
      const hub = track - t.w / 2 - 0.03;
      const lo = t.r - 0.08;
      const hi = t.r + 0.08;
      rods.push(
        [[x - 0.18, 0.16, side * inner], [x, lo, side * hub]],
        [[x + 0.18, 0.16, side * inner], [x, lo, side * hub]],
        [[x - 0.16, Math.max(0.3, body.y), side * inner], [x, hi, side * hub]],
        [[x + 0.16, Math.max(0.3, body.y), side * inner], [x, hi, side * hub]],
      );
    });
  });
  return (
    <group name="suspension_groups">
      {rods.map(([a, b], i) => (
        <Rod key={i} a={a} b={b} material={mats.carbon} />
      ))}
    </group>
  );
}

// The engine and gearbox, normally hidden inside the bodywork; the exploded
// view lifts it clear. Deliberately generic: a block with two cylinder banks.
function EngineBlock({ spec, mats }: { spec: CarSpec; mats: Mats }) {
  const x0 = spec.engineFront ? spec.frontAxle - 0.25 : spec.cockpit.x1 + 0.18;
  const x1 = spec.engineFront ? spec.cockpit.x0 - 0.15 : spec.rearAxle - 0.1;
  const mid = (x0 + x1) / 2;
  const body = widthAt(spec.tub, mid);
  const w = Math.min(0.34, body.w * 1.5);
  const y = body.y - 0.02;
  const len = x1 - x0;
  return (
    <group name="power_unit_proxy">
      <Box size={[len * 0.72, 0.16, w * 0.8]} position={[x0 + len * 0.36, y, 0]} material={mats.engine} />
      {[-1, 1].map((side) => (
        <Box
          key={side}
          size={[len * 0.66, 0.1, w * 0.42]}
          position={[x0 + len * 0.36, y + 0.1, side * w * 0.22]}
          rotation={[side * 0.45, 0, 0]}
          material={mats.engine}
        />
      ))}
      <Box size={[len * 0.28, 0.12, w * 0.5]} position={[x0 + len * 0.86, y - 0.02, 0]} material={mats.graphite} />
    </group>
  );
}

// A historically informed procedural car assembled from an era CarSpec.
// Component groups use the node names from spec §11.1 so the exploded view
// can move them independently.
export default function CarModel({ spec, helmet }: { spec: CarSpec; helmet?: HelmetDesign }) {
  const { gl } = useThree();
  const env = useMemo(() => studioEnvironment(gl), [gl]);
  const mats = useMaterials(env);

  const pods = spec.pods;
  const geos = useGeometry(() => {
    const podRings = (side: 1 | -1): Ring[] | null =>
      pods && [
        { x: pods.x0, w: pods.w * 0.85, y: pods.y, h: pods.h * 0.85, z: side * pods.z, n: pods.n },
        { x: pods.x0 + 0.2, w: pods.w, y: pods.y, h: pods.h, z: side * pods.z, n: pods.n },
        { x: pods.x0 + (pods.x1 - pods.x0) * 0.55, w: pods.w * 0.9, y: pods.y - 0.01, h: pods.h * 0.95, z: side * pods.z, n: pods.n },
        { x: pods.x1 - 0.25, w: pods.w * 0.55, y: pods.y - 0.04, h: pods.h * 0.7, z: side * pods.z * 0.85, n: pods.n },
        { x: pods.x1, w: 0.03, y: pods.y - 0.08, h: 0.05, z: side * pods.z * 0.6 },
      ];
    const pannier = (side: 1 | -1): Ring[] => [
      { x: -0.75, w: 0.02, y: 0.42, h: 0.02, z: side * 0.47 },
      { x: -0.6, w: 0.09, y: 0.42, h: 0.1, z: side * 0.47 },
      { x: 0.3, w: 0.1, y: 0.42, h: 0.11, z: side * 0.47 },
      { x: 0.7, w: 0.03, y: 0.42, h: 0.03, z: side * 0.47 },
    ];
    const r = pods ? podRings(-1) : null;
    const l = pods ? podRings(1) : null;
    return {
      tub: loft(spec.tub, 32),
      cover: spec.cover ? loft(spec.cover, 24) : null,
      podL: l ? loft(l, 24) : null,
      podR: r ? loft(r, 24) : null,
      pannierL: spec.panniers ? loft(pannier(1), 16) : null,
      pannierR: spec.panniers ? loft(pannier(-1), 16) : null,
      halo: spec.halo
        ? tube(
            [
              [spec.cockpit.x1 + 0.12, spec.cockpit.y - 0.02, 0.32],
              [spec.cockpit.x1 - 0.15, spec.cockpit.y + 0.16, 0.36],
              [spec.cockpit.x0 + 0.05, spec.cockpit.y + 0.2, 0.2],
              [spec.cockpit.x0 - 0.05, spec.cockpit.y + 0.19, 0],
              [spec.cockpit.x0 + 0.05, spec.cockpit.y + 0.2, -0.2],
              [spec.cockpit.x1 - 0.15, spec.cockpit.y + 0.16, -0.36],
              [spec.cockpit.x1 + 0.12, spec.cockpit.y - 0.02, -0.32],
            ],
            0.03,
          )
        : null,
      haloPillar: spec.halo
        ? tube(
            [
              [spec.cockpit.x0 - 0.05, spec.cockpit.y + 0.19, 0],
              [spec.cockpit.x0 - 0.16, spec.cockpit.y + 0.06, 0],
              [spec.cockpit.x0 - 0.22, spec.cockpit.y - 0.08, 0],
            ],
            0.028,
          )
        : null,
      exhausts: spec.exposedEngine
        ? mergeGeometries(
            [-1, 1].flatMap((side) =>
              [0.12, 0.2].map((z) =>
                tube(
                  [
                    [spec.exposedEngine!.x0 + 0.3, spec.exposedEngine!.y, side * z],
                    [spec.exposedEngine!.x1, spec.exposedEngine!.y + 0.05, side * (z + 0.03)],
                    [spec.rearAxle + 0.5, spec.exposedEngine!.y + 0.12, side * (z + 0.02)],
                  ],
                  0.022,
                ),
              ),
            ),
          )
        : null,
    };
  }, [spec]);

  const tubFront = spec.tub[0];
  const cockpitMid = (spec.cockpit.x0 + spec.cockpit.x1) / 2;
  const cockpitWidth = widthAt(spec.tub, cockpitMid).w * 0.72;
  const nose = widthAt(spec.tub, spec.frontWing ? spec.frontWing.x + 0.3 : tubFront.x);
  const paint = mats.paint;
  const wingPaint = spec.accent === "wing" ? mats.carbon : paint;

  return (
    <group name="car_root">
      <group name="chassis">
        <mesh geometry={geos.tub} material={paint} castShadow receiveShadow />
        {spec.accent === "nose" && (
          <mesh position={[tubFront.x + 0.1, tubFront.y, 0]} scale={[0.12, tubFront.h * 1.3, tubFront.w * 1.3]} material={mats.accent}>
            <sphereGeometry args={[1, 16, 10]} />
          </mesh>
        )}
        {spec.accent === "stripe" && (
          <Box
            size={[spec.cockpit.x0 - tubFront.x, 0.012, 0.12]}
            position={[(spec.cockpit.x0 + tubFront.x) / 2, widthAt(spec.tub, spec.cockpit.x0 - 0.6).y + widthAt(spec.tub, spec.cockpit.x0 - 0.6).h - 0.005, 0]}
            rotation={[0, 0, -0.08]}
            material={mats.accent}
            cast={false}
          />
        )}
        {spec.grille !== "none" &&
          (spec.grille === "oval"
            ? [0]
            : [-0.065, 0.065]
          ).map((z) => (
            <group key={z} position={[tubFront.x - 0.004, tubFront.y, z]} rotation={[0, -Math.PI / 2, 0]}>
              <mesh scale={[spec.grille === "oval" ? tubFront.w * 0.85 : 0.05, tubFront.h * 0.8, 1]} material={mats.dark}>
                <circleGeometry args={[1, 28]} />
              </mesh>
            </group>
          ))}
        {spec.roundels &&
          [-1, 1].map((side) => {
            const at = widthAt(spec.tub, spec.cockpit.x0 - 0.55);
            return (
              <mesh
                key={side}
                position={[spec.cockpit.x0 - 0.55, at.y + 0.02, side * (at.w + 0.004)]}
                rotation={[0, side > 0 ? 0 : Math.PI, 0]}
                material={mats.accent}
              >
                <circleGeometry args={[Math.min(0.13, at.h * 0.6), 28]} />
              </mesh>
            );
          })}
      </group>

      <group name="cockpit">
        <mesh position={[cockpitMid, spec.cockpit.y, 0]} scale={[(spec.cockpit.x1 - spec.cockpit.x0) / 2, 0.035, cockpitWidth]} material={mats.dark}>
          <sphereGeometry args={[1, 24, 10]} />
        </mesh>
        <group name="steering_wheel" position={[spec.cockpit.x0 + 0.1, spec.cockpit.y + 0.04, 0]} rotation={[0, Math.PI / 2, 0]}>
          {spec.family === "front50s" || spec.family === "rear60s" ? (
            <mesh material={mats.carbon} rotation={[0.5, 0, 0]}>
              <torusGeometry args={[0.17, 0.012, 6, 32]} />
            </mesh>
          ) : (
            <Box size={[0.26, 0.12, 0.03]} position={[0, 0, 0]} material={mats.carbon} cast={false} />
          )}
        </group>
        {/* Driver's helmet. */}
        <group position={[spec.driver.x, spec.driver.y, 0]}>
          {helmet ? (
            <group scale={0.125}>
              <Helmet design={helmet} />
            </group>
          ) : (
            <mesh material={mats.helmet} castShadow>
              <sphereGeometry args={[0.12, 24, 16]} />
            </mesh>
          )}
        </group>
        {spec.windscreen && (
          <Box
            size={[0.012, 0.13, cockpitWidth * 1.6]}
            position={[spec.cockpit.x0 - 0.02, spec.cockpit.y + 0.07, 0]}
            rotation={[0, 0, -0.45]}
            material={mats.glass}
            cast={false}
          />
        )}
        {!["front50s", "rear60s"].includes(spec.family) &&
          [-1, 1].map((side) => (
            <group key={side} position={[spec.cockpit.x0 + 0.08, spec.cockpit.y + 0.05, side * (cockpitWidth + 0.18)]}>
              <Box size={[0.03, 0.06, 0.12]} position={[0, 0, 0]} material={paint} />
              <Rod a={[0.02, -0.02, -side * 0.06]} b={[0.02, -0.08, -side * 0.18]} material={mats.carbon} radius={0.008} />
            </group>
          ))}
      </group>

      {spec.halo && geos.halo && geos.haloPillar && (
        <group name="halo">
          <mesh geometry={geos.halo} material={mats.carbon} castShadow />
          <mesh geometry={geos.haloPillar} material={mats.carbon} />
        </group>
      )}

      {geos.cover && spec.cover && (
        <group name="engine_cover">
          <mesh geometry={geos.cover} material={paint} castShadow />
          <mesh position={[spec.cover[0].x - 0.004, spec.cover[0].y, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[spec.cover[0].w * 0.8, spec.cover[0].h * 0.8, 1]} material={mats.dark}>
            <circleGeometry args={[1, 24]} />
          </mesh>
          {spec.sharkFin && (
            <Box
              size={[1.2, 0.2, 0.01]}
              position={[spec.cover[2].x + 0.55, spec.cover[2].y + 0.06, 0]}
              rotation={[0, 0, -0.12]}
              material={paint}
            />
          )}
        </group>
      )}

      {spec.airbox === "tall" && (
        <group name="airbox" position={[spec.driver.x + 0.36, 0.86, 0]}>
          <mesh rotation={[0, Math.PI / 4, 0]} scale={[1, 1, 1]} material={paint} castShadow>
            <cylinderGeometry args={[0.36, 0.18, 0.62, 4]} />
          </mesh>
          <Box size={[0.012, 0.16, 0.34]} position={[-0.2, 0.2, 0]} rotation={[0, 0, 0.3]} material={mats.dark} cast={false} />
          {spec.accent === "stripe" && (
            <Box size={[0.36, 0.04, 0.52]} position={[0.02, 0.24, 0]} material={mats.accent} cast={false} />
          )}
        </group>
      )}

      {spec.exposedEngine && (
        <group name="power_unit_proxy">
          <Box
            size={[spec.exposedEngine.x1 - spec.exposedEngine.x0, spec.exposedEngine.h * 2, spec.exposedEngine.w * 2]}
            position={[(spec.exposedEngine.x0 + spec.exposedEngine.x1) / 2, spec.exposedEngine.y, 0]}
            material={mats.engine}
          />
          {[-1, 1].map((side) => (
            <Box
              key={side}
              size={[spec.exposedEngine!.x1 - spec.exposedEngine!.x0 - 0.1, 0.05, 0.1]}
              position={[(spec.exposedEngine!.x0 + spec.exposedEngine!.x1) / 2, spec.exposedEngine!.y + spec.exposedEngine!.h + 0.02, side * spec.exposedEngine!.w * 0.55]}
              material={paint}
            />
          ))}
          <Box
            size={[spec.rearAxle + 0.35 - spec.exposedEngine.x1, 0.18, 0.28]}
            position={[(spec.exposedEngine.x1 + spec.rearAxle + 0.35) / 2, spec.exposedEngine.y + 0.02, 0]}
            material={mats.engine}
          />
          {geos.exhausts && <mesh geometry={geos.exhausts} material={mats.chrome} />}
        </group>
      )}

      {!spec.exposedEngine && <EngineBlock spec={spec} mats={mats} />}

      {geos.podL && geos.podR && pods && (
        <>
          {([[geos.podL, 1], [geos.podR, -1]] as const).map(([g, side]) => (
            <group key={side} name={side > 0 ? "sidepod_left" : "sidepod_right"}>
              <mesh geometry={g} material={paint} castShadow />
              <mesh position={[pods.x0 - 0.003, pods.y, side * pods.z]} rotation={[0, -Math.PI / 2, 0]} scale={[pods.w * 0.7, pods.h * 0.7, 1]} material={mats.dark}>
                <circleGeometry args={[1, 20]} />
              </mesh>
              {spec.periscopes && (
                <mesh position={[pods.x0 + (pods.x1 - pods.x0) * 0.62, pods.y + pods.h * 0.9, side * (pods.z - 0.05)]} material={mats.carbon}>
                  <cylinderGeometry args={[0.035, 0.045, 0.1, 12]} />
                </mesh>
              )}
            </group>
          ))}
        </>
      )}
      {geos.pannierL && geos.pannierR && (
        <group name="panniers">
          <mesh geometry={geos.pannierL} material={paint} castShadow />
          <mesh geometry={geos.pannierR} material={paint} castShadow />
        </group>
      )}

      {spec.bargeboards > 0 && pods && (
        <group name="bargeboards">
          {[-1, 1].flatMap((side) =>
            Array.from({ length: spec.bargeboards }, (_, i) => (
              <Box
                key={`${side}-${i}`}
                size={[0.16, 0.26 - i * 0.03, 0.008]}
                position={[pods.x0 - 0.3 + i * 0.09, 0.2, side * (pods.z - 0.02 + i * 0.03)]}
                rotation={[0, side * 0.12, 0]}
                material={mats.carbon}
              />
            )),
          )}
        </group>
      )}

      {spec.frontWing && (
        <>
          <Wing wing={spec.frontWing} mats={mats} material={wingPaint} name="front_wing" />
          {spec.wingPillars && (
            <group name="front_wing_supports">
              {[-1, 1].map((side) => (
                <Box
                  key={side}
                  size={[0.14, nose.y - spec.frontWing!.y, 0.01]}
                  position={[spec.frontWing!.x + 0.12, (nose.y + spec.frontWing!.y) / 2, side * 0.09]}
                  material={mats.carbon}
                />
              ))}
            </group>
          )}
        </>
      )}

      {spec.rearWing && (
        <>
          <Wing
            wing={spec.rearWing}
            mats={mats}
            material={wingPaint}
            name="rear_wing"
            plateBottom={spec.rearPylon === "endplate" ? 0.3 : undefined}
          />
          <group name="rear_wing_supports">
            <Box
              size={[spec.rearPylon === "central" ? 0.1 : 0.16, spec.rearWing.y - 0.4, 0.025]}
              position={[spec.rearWing.x - 0.05, (spec.rearWing.y + 0.4) / 2, 0]}
              material={mats.carbon}
            />
          </group>
          {spec.beamWing != null && (
            <group name="beam_wing" position={[spec.rearWing.x - 0.08, spec.beamWing, 0]}>
              <Box size={[0.2, 0.025, spec.rearWing.span * 0.9]} position={[0, 0, 0]} rotation={[0, 0, 0.2]} material={mats.carbon} />
            </group>
          )}
        </>
      )}

      {spec.floor && (
        <group name="floor">
          <Box size={[spec.floor.x1 - spec.floor.x0, 0.022, spec.floor.w * 2]} position={[(spec.floor.x0 + spec.floor.x1) / 2, 0.06, 0]} material={mats.carbon} />
          <Box size={[spec.floor.x1 - spec.floor.x0 - 0.3, 0.012, 0.3]} position={[(spec.floor.x0 + spec.floor.x1) / 2, 0.043, 0]} material={mats.brake} cast={false} />
        </group>
      )}
      {spec.diffuser && (
        <group name="diffuser" position={[(spec.diffuser.x0 + spec.diffuser.x1) / 2, 0.06 + spec.diffuser.rise / 2, 0]}>
          <Box
            size={[Math.hypot(spec.diffuser.x1 - spec.diffuser.x0, spec.diffuser.rise), 0.02, spec.diffuser.w * 2]}
            position={[0, 0, 0]}
            rotation={[0, 0, Math.atan2(spec.diffuser.rise, spec.diffuser.x1 - spec.diffuser.x0)]}
            material={mats.carbon}
          />
          {[-0.66, -0.22, 0.22, 0.66].map((f) => (
            <Box
              key={f}
              size={[spec.diffuser!.x1 - spec.diffuser!.x0, spec.diffuser!.rise * 0.9, 0.008]}
              position={[0.02, 0, f * spec.diffuser!.w]}
              material={mats.carbon}
            />
          ))}
        </group>
      )}

      {([true, false] as const).flatMap((front) =>
        ([-1, 1] as const).map((side) => (
          <Wheel key={`${front}-${side}`} spec={spec} front={front} side={side} mats={mats} />
        )),
      )}
      <Suspension spec={spec} mats={mats} />
    </group>
  );
}
