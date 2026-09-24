import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import {
  CapsuleGeometry,
  CylinderGeometry,
  LatheGeometry,
  MeshStandardMaterial,
  SphereGeometry,
  Vector2,
} from "three";
import type { SuitDesign } from "../../data/liveries";
import Helmet from "../helmets/Helmet";
import type { HelmetDesign } from "../helmets/helmetArt";
import { studioEnvironment } from "../studio";

type V3 = [number, number, number];

// A museum display figure: a faceless mannequin dressed in the driver's
// Ferrari-era race wear. It is deliberately not a likeness of the person.
// Units are metres; the figure faces +X and stands on y = 0.

const DEFAULT_SUIT: SuitDesign = {
  base: "#c3121c",
  accents: [{ area: "shoulders", color: "#f2efe8" }],
  style: "overalls",
};

function Limb({
  from,
  to,
  radius,
  material,
}: {
  from: V3;
  to: V3;
  radius: number;
  material: MeshStandardMaterial;
}) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const length = Math.hypot(dx, dy, dz);
  // Orient a Y-up capsule along from→to.
  const yaw = Math.atan2(dx, dz);
  const pitch = Math.acos(dy / length);
  return (
    <group position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2]} rotation={[0, yaw, 0]}>
      <mesh rotation={[pitch, 0, 0]} material={material} castShadow>
        <capsuleGeometry args={[radius, Math.max(0.01, length - radius * 2), 6, 14]} />
      </mesh>
    </group>
  );
}

export default function DriverFigure({
  suit = DEFAULT_SUIT,
  helmet,
  wearHelmet,
}: {
  suit?: SuitDesign;
  helmet: HelmetDesign;
  /** Early drivers wear the helmet; later ones carry it. */
  wearHelmet: boolean;
}) {
  const { gl } = useThree();
  const env = useMemo(() => studioEnvironment(gl), [gl]);
  const accent = (area: SuitDesign["accents"][number]["area"]) =>
    suit.accents.find((a) => a.area === area)?.color;
  const polo = suit.style === "polo-and-trousers";

  const mats = useMemo(() => {
    const cloth = (color: string, roughness = 0.78) =>
      new MeshStandardMaterial({ color, roughness, metalness: 0, envMap: env, envMapIntensity: 0.35 });
    const trousers = (suit as SuitDesign & { trousers?: string }).trousers;
    return {
      suit: cloth(suit.base),
      // Polo-era entries record the trouser colour as the "legs" accent.
      trousers: cloth(trousers ?? (polo ? accent("legs") ?? "#3a3a3e" : suit.base)),
      shoulders: cloth(accent("shoulders") ?? suit.base),
      sides: cloth(accent("sides") ?? accent("legs") ?? suit.base),
      collar: cloth(accent("collar") ?? suit.base),
      belt: cloth(accent("belt") ?? (polo ? "#2a2522" : suit.base)),
      // Matte mannequin finish for head and hands.
      form: new MeshStandardMaterial({ color: "#d9d6cf", roughness: 0.55, metalness: 0.05, envMap: env, envMapIntensity: 0.4 }),
      boots: cloth(polo ? "#3b2a20" : "#1a1a1d", 0.5),
      gloves: cloth(polo ? "#d9d6cf" : "#1c1c20", 0.7),
      base: new MeshStandardMaterial({ color: "#1b1c20", roughness: 0.35, metalness: 0.6, envMap: env }),
    };
  }, [env, suit, polo]);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  const geos = useMemo(() => {
    // Torso: a lathe profile from hips to shoulders, slightly flattened front-to-back.
    const torso = new LatheGeometry(
      [
        new Vector2(0.001, 0.92),
        new Vector2(0.17, 0.93),
        new Vector2(0.175, 1.0),
        new Vector2(0.15, 1.12),
        new Vector2(0.165, 1.26),
        new Vector2(0.19, 1.38),
        new Vector2(0.17, 1.45),
        new Vector2(0.07, 1.5),
        new Vector2(0.001, 1.505),
      ],
      32,
    );
    torso.scale(0.8, 1, 1.12);
    const head = new SphereGeometry(0.105, 28, 20);
    head.scale(0.9, 1.15, 0.85);
    return {
      torso,
      head,
      neck: new CylinderGeometry(0.045, 0.05, 0.1, 16),
      collar: new CylinderGeometry(0.062, 0.07, 0.04, 20),
      belt: new CylinderGeometry(0.125, 0.125, 0.05, 28),
      boot: new CapsuleGeometry(0.055, 0.14, 4, 10),
      plinth: new CylinderGeometry(0.42, 0.45, 0.06, 40),
      band: new CylinderGeometry(0.182, 0.182, 0.05, 28),
    };
  }, []);
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos]);

  const sleeve = polo ? mats.form : mats.suit;
  return (
    <group>
      <mesh geometry={geos.plinth} material={mats.base} position={[0, 0.03, 0]} receiveShadow />
      <group position={[0, 0.06, 0]}>
        {/* Legs and boots. */}
        {[-1, 1].map((side) => (
          <group key={side}>
            <Limb from={[0, 0.94, side * 0.09]} to={[0.01, 0.1, side * 0.1]} radius={0.085} material={mats.trousers} />
            {accent("legs") && !polo && (
              <Limb from={[0, 0.9, side * 0.155]} to={[0.01, 0.14, side * 0.165]} radius={0.012} material={mats.sides} />
            )}
            <mesh geometry={geos.boot} material={mats.boots} position={[0.05, 0.05, side * 0.1]} rotation={[0, 0, Math.PI / 2]} />
          </group>
        ))}
        {/* Torso, belt, collar. */}
        <mesh geometry={geos.torso} material={mats.suit} castShadow />
        <mesh geometry={geos.belt} material={mats.belt} position={[0, 0.96, 0]} scale={[0.8, 1, 1.12]} />
        {accent("shoulders") && (
          <mesh geometry={geos.band} material={mats.shoulders} position={[0, 1.4, 0]} scale={[0.8, 1, 1.14]} />
        )}
        {accent("sides") &&
          [-1, 1].map((side) => (
            <Limb key={side} from={[0, 1.36, side * 0.19]} to={[0, 0.98, side * 0.176]} radius={0.014} material={mats.sides} />
          ))}
        <mesh geometry={geos.neck} material={mats.form} position={[0, 1.54, 0]} />
        <mesh geometry={geos.collar} material={mats.collar} position={[0, 1.515, 0]} />
        {/* Head: a plain form, or the helmet itself for early drivers. */}
        <group position={[0.01, 1.66, 0]}>
          {wearHelmet ? (
            <group scale={0.14} rotation={[0, Math.PI, 0]}>
              <Helmet design={helmet} />
            </group>
          ) : (
            <mesh geometry={geos.head} material={mats.form} castShadow />
          )}
        </group>
        {/* Right arm hangs; left arm carries the helmet at the hip. */}
        <Limb from={[0, 1.42, -0.23]} to={[0.02, 1.13, -0.27]} radius={0.062} material={mats.suit} />
        <Limb from={[0.02, 1.13, -0.24]} to={[0.05, 0.86, -0.25]} radius={0.052} material={sleeve} />
        <mesh material={mats.gloves} position={[0.055, 0.8, -0.25]} scale={[0.8, 1.2, 0.6]}>
          <sphereGeometry args={[0.045, 12, 10]} />
        </mesh>
        <Limb from={[0, 1.42, 0.23]} to={[0.04, 1.14, 0.26]} radius={0.062} material={mats.suit} />
        <Limb from={[0.04, 1.14, 0.26]} to={[0.2, 1.0, 0.24]} radius={0.052} material={sleeve} />
        {!wearHelmet && (
          <group position={[0.24, 1.04, 0.3]} rotation={[0.1, -0.6, 0.15]} scale={0.14}>
            <Helmet design={helmet} />
          </group>
        )}
        <mesh material={mats.gloves} position={[0.22, 1.0, 0.24]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.045, 12, 10]} />
        </mesh>
      </group>
    </group>
  );
}
