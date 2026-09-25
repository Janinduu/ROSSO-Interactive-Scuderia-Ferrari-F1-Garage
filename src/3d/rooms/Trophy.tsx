import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import {
  CylinderGeometry,
  LatheGeometry,
  MeshPhysicalMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from "three";
import type { BufferGeometry, Material } from "three";
import { studioEnvironment } from "../studio";

// Era-inspired championship trophies. The shapes follow how trophies looked in
// each period (see constructorsLegacy.json) without copying any specific,
// trademarked design. All are about 0.55–0.75 units tall at scale 1.

export type TrophyStyle = "cup" | "goblet" | "modern";

export function trophyStyleFor(year: number, eras?: { from: number; to: number; style?: TrophyStyle }[]) {
  const e = eras?.find((x) => year >= x.from && year <= x.to && x.style);
  if (e?.style) return e.style;
  return year <= 1977 ? "cup" : year <= 1995 ? "goblet" : "modern";
}

const lathe = (points: [number, number][], segments = 48) =>
  new LatheGeometry(points.map(([x, y]) => new Vector2(x, y)), segments);

function useTrophyKit() {
  const { gl } = useThree();
  const env = useMemo(() => studioEnvironment(gl), [gl]);
  const kit = useMemo(() => {
    const metal = (color: string, roughness: number) =>
      new MeshPhysicalMaterial({ color, metalness: 1, roughness, clearcoat: 0.4, envMap: env, envMapIntensity: 1.5 });
    return {
      geo: {
        // 1950s–70s: a two-handled cup on a turned foot.
        cup: lathe([
          [0.001, 0], [0.13, 0], [0.13, 0.03], [0.07, 0.05], [0.035, 0.09],
          [0.03, 0.2], [0.05, 0.23], [0.03, 0.26], [0.06, 0.3], [0.13, 0.36],
          [0.155, 0.46], [0.15, 0.52], [0.16, 0.53], [0.14, 0.535], [0.12, 0.43],
          [0.001, 0.33],
        ]),
        handle: new TorusGeometry(0.075, 0.012, 8, 24, Math.PI),
        // 1978–95: a tall lidded goblet with a finial.
        goblet: lathe([
          [0.001, 0], [0.12, 0], [0.12, 0.025], [0.08, 0.04], [0.05, 0.08],
          [0.028, 0.2], [0.045, 0.24], [0.028, 0.28], [0.05, 0.31], [0.11, 0.36],
          [0.125, 0.47], [0.115, 0.55], [0.13, 0.56], [0.1, 0.6], [0.05, 0.63],
          [0.025, 0.66], [0.001, 0.665],
        ]),
        finial: new SphereGeometry(0.03, 16, 12),
        // 1996 onwards: a slender, sculpted spire on a stepped base.
        modern: lathe([
          [0.001, 0], [0.13, 0], [0.13, 0.05], [0.1, 0.05], [0.1, 0.09],
          [0.06, 0.1], [0.035, 0.18], [0.03, 0.36], [0.06, 0.5], [0.075, 0.6],
          [0.05, 0.68], [0.015, 0.74], [0.001, 0.75],
        ], 64),
        base: new CylinderGeometry(0.16, 0.17, 0.05, 48),
      } as Record<string, BufferGeometry>,
      mat: {
        gold: metal("#d8b25a", 0.22),
        silver: metal("#d9dde2", 0.16),
        dark: new MeshPhysicalMaterial({ color: "#121214", roughness: 0.25, metalness: 0.4, clearcoat: 1, envMap: env }),
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

export default function Trophy({ style, material = "gold" }: { style: TrophyStyle; material?: "gold" | "silver" }) {
  const { geo, mat } = useTrophyKit();
  const m = mat[material];
  if (style === "cup")
    return (
      <group>
        <mesh geometry={geo.cup} material={m} castShadow />
        {[-1, 1].map((h) => (
          <mesh key={h} geometry={geo.handle} material={m} position={[h * 0.15, 0.44, 0]} rotation={[0, 0, (h * -Math.PI) / 2]} />
        ))}
      </group>
    );
  if (style === "goblet")
    return (
      <group>
        <mesh geometry={geo.goblet} material={m} castShadow />
        <mesh geometry={geo.finial} material={m} position={[0, 0.69, 0]} />
      </group>
    );
  return (
    <group>
      <mesh geometry={geo.base} material={mat.dark} position={[0, 0.025, 0]} />
      <mesh geometry={geo.modern} material={m} position={[0, 0.05, 0]} castShadow />
    </group>
  );
}
