import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import {
  BufferGeometry,
  Float32BufferAttribute,
  CylinderGeometry,
  TorusGeometry,
  CanvasTexture,
  SRGBColorSpace,
  DoubleSide,
  LatheGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TubeGeometry,
  CatmullRomCurve3,
  Vector2,
  Vector3,
} from "three";
import type { Material } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { studioEnvironment } from "../studio";

// Championship trophies by era, following constructorsLegacy.json:
// - to 1962: small, flared silver FIA beakers (medium confidence);
// - 1963–94: no reliable source, so a deliberately generic cup;
// - from 1995: the tall flared silver vase of the constructors' trophy, and
//   the drivers' trophy with its gold spiral band (high confidence).
// Shapes are simplified interpretations, not replicas. About 0.5–0.75 units tall.

export type TrophyStyle = "beaker" | "generic" | "vase" | "spiral";
export type TitleKind = "constructors" | "drivers";

export function trophyStyleFor(year: number, kind: TitleKind): TrophyStyle {
  if (year <= 1962) return "beaker";
  if (year <= 1994) return "generic";
  return kind === "drivers" ? "spiral" : "vase";
}

export const trophyCaption: Record<TrophyStyle, string> = {
  beaker:
    "Era trophy: a flared silver FIA cup, as photographed in the 1950s–60s",
  generic: "Generic trophy: no reliable record of this era's award was found",
  vase: "Era trophy: the tall silver constructors' vase made in 1995",
  spiral:
    "Era trophy: the silver drivers' trophy with its gold spiral, made in 1995",
};

const lathe = (points: [number, number][], segments = 96) =>
  new LatheGeometry(
    points.map(([x, y]) => new Vector2(x, y)),
    segments,
  );

function useTrophyKit() {
  const { gl } = useThree();
  const env = useMemo(() => studioEnvironment(gl), [gl]);
  const kit = useMemo(() => {
    const metal = (color: string, roughness: number) =>
      new MeshPhysicalMaterial({
        side: DoubleSide,
        color,
        metalness: 1,
        roughness,
        clearcoat: 0.4,
        envMap: env,
        envMapIntensity: 1.5,
      });
    // Fox Silver's award has broad laurel-edged spirals, not a wire coil.
    const helix: Vector3[] = [];
    const leaves: BufferGeometry[] = [];
    for (let i = 0; i <= 240; i++) {
      const t = i / 240,
        y = 0.14 + t * 0.43;
      const r = 0.041 + 0.088 * t * t + 0.012;
      const angle = t * Math.PI * 8;
      helix.push(new Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
      if (i % 3 === 0)
        for (const side of [-1, 1]) {
          const leaf = new SphereGeometry(1, 6, 4);
          leaf.scale(0.004, 0.011, 0.003);
          leaf.rotateZ(side * 0.65);
          leaf.rotateY(-angle);
          leaf.translate(
            Math.cos(angle) * (r + 0.004),
            y + side * 0.012,
            Math.sin(angle) * (r + 0.004),
          );
          leaves.push(leaf);
        }
    }
    const laurel = mergeGeometries(leaves);
    leaves.forEach((g) => g.dispose());
    const ribbon = new BufferGeometry(),
      vertices: number[] = [],
      indices: number[] = [];
    helix.forEach((v, i) => {
      vertices.push(v.x, v.y - 0.007, v.z, v.x, v.y + 0.007, v.z);
      if (i < helix.length - 1) {
        const j = i * 2;
        indices.push(j, j + 2, j + 1, j + 2, j + 3, j + 1);
      }
    });
    ribbon.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    ribbon.setIndex(indices);
    ribbon.computeVertexNormals();
    const crown = lathe(
      [
        [0.127, 0.575],
        [0.139, 0.59],
        [0.145, 0.617],
        [0.137, 0.62],
        [0.128, 0.594],
      ],
      96,
    );
    const cp = crown.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      const angle = Math.atan2(cp.getZ(i), cp.getX(i));
      cp.setY(
        i,
        cp.getY(i) + Math.pow(Math.max(0, Math.cos(angle * 12)), 2) * 0.035,
      );
    }
    crown.computeVertexNormals();
    return {
      geo: {
        crown,
        laurel,
        ribbon,
        rolledRim: new TorusGeometry(0.111, 0.004, 8, 64),
        baseRing: new TorusGeometry(0.127, 0.005, 8, 64),
        beaker: lathe([
          [0.001, 0],
          [0.09, 0],
          [0.09, 0.02],
          [0.06, 0.035],
          [0.06, 0.05],
          [0.07, 0.06],
          [0.1, 0.28],
          [0.112, 0.4],
          [0.105, 0.405],
          [0.094, 0.3],
          [0.001, 0.07],
        ]),
        generic: lathe([
          [0.001, 0],
          [0.12, 0],
          [0.12, 0.025],
          [0.08, 0.04],
          [0.05, 0.08],
          [0.028, 0.2],
          [0.045, 0.24],
          [0.028, 0.28],
          [0.05, 0.31],
          [0.11, 0.36],
          [0.125, 0.47],
          [0.115, 0.55],
          [0.13, 0.56],
          [0.1, 0.6],
          [0.05, 0.63],
          [0.025, 0.66],
          [0.001, 0.665],
        ]),
        finial: new SphereGeometry(0.03, 16, 12),
        // A trumpet-like vase: wide round foot, narrow waist, flaring body.
        vase: lathe(
          [
            [0.001, 0.04],
            [0.12, 0.04],
            [0.12, 0.07],
            [0.07, 0.1],
            [0.035, 0.16],
            [0.04, 0.24],
            [0.07, 0.4],
            [0.11, 0.56],
            [0.14, 0.66],
            [0.13, 0.665],
            [0.1, 0.58],
            [0.001, 0.5],
          ],
          48, // gently faceted silver panels
        ),
        spiral: lathe(
          [
            [0.001, 0.04],
            [0.12, 0.04],
            [0.12, 0.07],
            [0.07, 0.1],
            [0.04, 0.16],
            [0.05, 0.3],
            [0.09, 0.48],
            [0.125, 0.58],
            [0.12, 0.585],
            [0.09, 0.52],
            [0.001, 0.45],
          ],
          48,
        ),
        band: new TubeGeometry(new CatmullRomCurve3(helix), 240, 0.0045, 8),
        globe: new SphereGeometry(0.032, 32, 20),
        collar: new CylinderGeometry(0.15, 0.13, 0.03, 12),
        foot: new CylinderGeometry(0.13, 0.14, 0.04, 48),
        badge: new CylinderGeometry(0.012, 0.012, 0.004, 12),
      } as Record<string, BufferGeometry>,
      mat: {
        silver: metal("#e2e3df", 0.2),
        gold: metal("#c49b43", 0.24),
        dark: new MeshPhysicalMaterial({
          color: "#16161a",
          roughness: 0.25,
          metalness: 0.4,
          clearcoat: 1,
          envMap: env,
        }),
        blue: metal("#173856", 0.16),
        engraved: metal("#727774", 0.44),
        enamel: new MeshStandardMaterial({
          color: "#b3141c",
          roughness: 0.3,
          metalness: 0.2,
        }),
      } as Record<string, Material>,
    };
  }, [env]);
  useEffect(
    () => () => {
      Object.values(kit.geo).forEach((g) => g.dispose());
      Object.values(kit.mat).forEach((m) => m.dispose());
    },
    [kit],
  );
  return kit;
}

export default function Trophy({
  style,
  year,
}: {
  style: TrophyStyle;
  year?: number;
}) {
  const { geo, mat } = useTrophyKit();
  if (style === "beaker")
    return (
      <group>
        <mesh geometry={geo.beaker} material={mat.silver} castShadow />
        <mesh
          geometry={geo.rolledRim}
          material={mat.silver}
          position={[0, 0.401, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Engraving year={year} y={0.22} radius={0.093} />
      </group>
    );
  if (style === "generic")
    return (
      <group>
        <mesh geometry={geo.generic} material={mat.gold} castShadow />
        <mesh
          geometry={geo.finial}
          material={mat.gold}
          position={[0, 0.69, 0]}
        />
        <mesh geometry={geo.foot} material={mat.dark} position={[0, 0.02, 0]} />
        <Engraving year={year} y={0.04} radius={0.143} />
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.126, 0.43, 0]}
            scale={[0.75, 1, 1]}
            material={mat.gold}
          >
            <torusGeometry args={[0.09, 0.011, 10, 32, Math.PI * 1.65]} />
          </mesh>
        ))}
      </group>
    );
  if (style === "vase")
    return (
      <group>
        <mesh geometry={geo.foot} material={mat.dark} position={[0, 0.02, 0]} />
        <mesh geometry={geo.vase} material={mat.silver} castShadow />
        <mesh
          geometry={geo.crown}
          material={mat.dark}
          position={[0, 0.06, 0]}
        />
        <mesh
          geometry={geo.baseRing}
          material={mat.gold}
          position={[0, 0.071, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Engraving year={year} y={0.33} radius={0.06} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return (
            <mesh
              key={i}
              material={mat.gold}
              position={[Math.cos(a) * 0.096, 0.475, Math.sin(a) * 0.096]}
              rotation={[0, -a, 0]}
              scale={[0.004, 0.17, 0.004]}
            >
              <sphereGeometry args={[1, 6, 8]} />
            </mesh>
          );
        })}
        {/* One small enamel badge per panel, as the real trophy carries per champion. */}
        {Array.from({ length: 36 }, (_, i) => {
          const a = (((i % 12) + 0.5) / 12) * Math.PI * 2;
          const row = Math.floor(i / 12);
          const r = 0.083 + row * 0.018;
          return (
            <mesh
              key={i}
              geometry={geo.badge}
              material={mat.enamel}
              position={[Math.cos(a) * r, 0.45 + row * 0.075, Math.sin(a) * r]}
              rotation={[0, -a, Math.PI / 2 - 0.35]}
            />
          );
        })}
      </group>
    );
  return (
    <group>
      <mesh geometry={geo.foot} material={mat.dark} position={[0, 0.02, 0]} />
      <mesh geometry={geo.spiral} material={mat.silver} castShadow />
      <mesh geometry={geo.band} material={mat.gold} />
      <mesh geometry={geo.laurel} material={mat.gold} />
      <mesh geometry={geo.ribbon} material={mat.gold} />
      <mesh geometry={geo.crown} material={mat.dark} />
      <mesh
        geometry={geo.baseRing}
        material={mat.gold}
        position={[0, 0.071, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <Engraving year={year} y={0.31} radius={0.06} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <mesh
            key={i}
            material={mat.gold}
            position={[Math.cos(a) * 0.109, 0.085, Math.sin(a) * 0.109]}
            rotation={[Math.PI / 2, 0, -a]}
          >
            <torusGeometry args={[0.012, 0.0025, 5, 12]} />
          </mesh>
        );
      })}
      <mesh
        geometry={geo.globe}
        material={mat.blue}
        position={[0.035, 0.594, 0.108]}
      />
      {[0, Math.PI / 2].map((a) => (
        <mesh
          key={a}
          material={mat.gold}
          position={[0.035, 0.594, 0.108]}
          rotation={[0, a, 0]}
        >
          <torusGeometry args={[0.0325, 0.0015, 5, 32]} />
        </mesh>
      ))}
    </group>
  );
}

// Restrained etched lettering: no invented champion signatures.
function Engraving({
  year,
  y,
  radius,
}: {
  year?: number;
  y: number;
  radius: number;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const c = canvas.getContext("2d")!;
    c.fillStyle = "#68665c";
    c.textAlign = "center";
    c.font = "20px Georgia";
    c.fillText("FIA FORMULA ONE", 256, 36);
    c.font = "14px Georgia";
    c.fillText("WORLD CHAMPIONSHIP", 256, 64);
    c.font = "24px Georgia";
    c.fillText(year ? String(year) : "CHAMPION", 256, 101);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [year]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[0, y, 0]} rotation={[0, Math.PI / 2, 0]}>
      <cylinderGeometry
        args={[radius, radius, 0.055, 48, 1, true, -0.8, 1.6]}
      />
      <meshStandardMaterial
        map={texture}
        transparent
        depthWrite={false}
        side={DoubleSide}
        roughness={0.6}
        metalness={0.65}
      />
    </mesh>
  );
}
