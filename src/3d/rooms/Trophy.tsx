import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import {
  CylinderGeometry,
  LatheGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TubeGeometry,
  CatmullRomCurve3,
  Vector2,
  Vector3,
} from "three";
import type { BufferGeometry, Material } from "three";
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
  beaker: "Era trophy: a flared silver FIA cup, as photographed in the 1950s–60s",
  generic: "Generic trophy: no reliable record of this era's award was found",
  vase: "Era trophy: the tall silver constructors' vase made in 1995",
  spiral: "Era trophy: the silver drivers' trophy with its gold spiral, made in 1995",
};

const lathe = (points: [number, number][], segments = 48) =>
  new LatheGeometry(points.map(([x, y]) => new Vector2(x, y)), segments);

function useTrophyKit() {
  const { gl } = useThree();
  const env = useMemo(() => studioEnvironment(gl), [gl]);
  const kit = useMemo(() => {
    const metal = (color: string, roughness: number) =>
      new MeshPhysicalMaterial({ color, metalness: 1, roughness, clearcoat: 0.4, envMap: env, envMapIntensity: 1.5 });
    // The drivers' trophy's gold band winds up the body.
    const helix: Vector3[] = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const y = 0.16 + t * 0.4;
      const r = 0.05 + t * 0.075 + 0.004;
      helix.push(new Vector3(Math.cos(t * Math.PI * 5) * r, y, Math.sin(t * Math.PI * 5) * r));
    }
    return {
      geo: {
        beaker: lathe([
          [0.001, 0], [0.09, 0], [0.09, 0.02], [0.06, 0.035], [0.06, 0.05],
          [0.07, 0.06], [0.1, 0.28], [0.112, 0.4], [0.105, 0.405], [0.094, 0.3],
          [0.001, 0.07],
        ]),
        generic: lathe([
          [0.001, 0], [0.12, 0], [0.12, 0.025], [0.08, 0.04], [0.05, 0.08],
          [0.028, 0.2], [0.045, 0.24], [0.028, 0.28], [0.05, 0.31], [0.11, 0.36],
          [0.125, 0.47], [0.115, 0.55], [0.13, 0.56], [0.1, 0.6], [0.05, 0.63],
          [0.025, 0.66], [0.001, 0.665],
        ]),
        finial: new SphereGeometry(0.03, 16, 12),
        // A trumpet-like vase: wide round foot, narrow waist, flaring body.
        vase: lathe(
          [
            [0.001, 0.04], [0.12, 0.04], [0.12, 0.07], [0.07, 0.1], [0.035, 0.16],
            [0.04, 0.24], [0.07, 0.4], [0.11, 0.56], [0.14, 0.66], [0.13, 0.665],
            [0.1, 0.58], [0.001, 0.5],
          ],
          12, // faceted panels
        ),
        spiral: lathe(
          [
            [0.001, 0.04], [0.12, 0.04], [0.12, 0.07], [0.07, 0.1], [0.04, 0.16],
            [0.05, 0.3], [0.09, 0.48], [0.125, 0.58], [0.12, 0.585], [0.09, 0.52],
            [0.001, 0.45],
          ],
          48,
        ),
        band: new TubeGeometry(new CatmullRomCurve3(helix), 160, 0.009, 6),
        globe: new SphereGeometry(0.035, 20, 14),
        collar: new CylinderGeometry(0.15, 0.13, 0.03, 12),
        foot: new CylinderGeometry(0.13, 0.14, 0.04, 48),
        badge: new CylinderGeometry(0.012, 0.012, 0.004, 12),
      } as Record<string, BufferGeometry>,
      mat: {
        silver: metal("#dde1e6", 0.14),
        gold: metal("#d8b25a", 0.2),
        dark: new MeshPhysicalMaterial({ color: "#16161a", roughness: 0.25, metalness: 0.4, clearcoat: 1, envMap: env }),
        enamel: new MeshStandardMaterial({ color: "#b3141c", roughness: 0.3, metalness: 0.2 }),
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

export default function Trophy({ style }: { style: TrophyStyle }) {
  const { geo, mat } = useTrophyKit();
  if (style === "beaker") return <mesh geometry={geo.beaker} material={mat.silver} castShadow />;
  if (style === "generic")
    return (
      <group>
        <mesh geometry={geo.generic} material={mat.gold} castShadow />
        <mesh geometry={geo.finial} material={mat.gold} position={[0, 0.69, 0]} />
      </group>
    );
  if (style === "vase")
    return (
      <group>
        <mesh geometry={geo.foot} material={mat.dark} position={[0, 0.02, 0]} />
        <mesh geometry={geo.vase} material={mat.silver} castShadow />
        <mesh geometry={geo.collar} material={mat.dark} position={[0, 0.67, 0]} />
        {/* One small enamel badge per panel, as the real trophy carries per champion. */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = ((i + 0.5) / 12) * Math.PI * 2;
          const r = 0.098;
          return (
            <mesh
              key={i}
              geometry={geo.badge}
              material={mat.enamel}
              position={[Math.cos(a) * r, 0.47, Math.sin(a) * r]}
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
      <mesh geometry={geo.globe} material={mat.gold} position={[0, 0.63, 0]} />
    </group>
  );
}
