import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
  BackSide,
  CanvasTexture,
  CylinderGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  SRGBColorSpace,
} from "three";
import type { BufferGeometry } from "three";
import { studioEnvironment } from "../studio";
import { tube } from "../cars/geometry";
import { loadBoardFonts } from "../bays/boardArt";
import {
  HELMET_TEX_H,
  HELMET_TEX_W,
  OPEN_THETA,
  SHELL_THETA,
  paintHelmet,
} from "./helmetArt";
import type { HelmetDesign } from "./helmetArt";

// Shape a unit sphere into a racing helmet: longer front to back, a chin bar
// that juts forward, a flared lower rear and a flatter crown. The front faces -X.
function sculpt(g: BufferGeometry, fullFace: boolean, year = 2004) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i) * 1.12;
    let y = p.getY(i) * 1.04;
    let z = p.getZ(i) * 0.92;
    // Early full-face shells are rounder; modern helmets have a flatter chin
    // and a lower crown. Keep the painted UVs intact on each silhouette.
    if (fullFace && year < 1985) {
      x *= 0.95;
      y *= 1.03;
    }
    if (fullFace && year >= 2010 && y < -0.2 && x < 0)
      x = Math.max(-1.17, x * 1.07);
    if (fullFace && y < 0) {
      const low = Math.min(1, -y / 0.85);
      // Chin bar: the lower front juts forward and narrows.
      if (x < 0) {
        x += 0.22 * low * x;
        z *= 1 - 0.12 * low * -x;
      }
      // Lower edge slopes up towards the back of the neck.
      if (low > 0.55) y += 0.2 * (low - 0.55) * (x + 0.3);
      // Slight flare at the lower rear.
      if (x > 0) x += 0.06 * low * x;
    }
    if (y > 0.6) y = 0.6 + (y - 0.6) * 0.78;
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

const visorColors: Record<
  HelmetDesign["visorTint"],
  { color: string; metalness: number; opacity: number }
> = {
  clear: { color: "#b7c6cf", metalness: 0.2, opacity: 0.35 },
  dark: { color: "#0b0c0f", metalness: 0.6, opacity: 1 },
  "iridium-blue": { color: "#2c5fb3", metalness: 0.9, opacity: 1 },
  "iridium-gold": { color: "#b68a2b", metalness: 0.95, opacity: 1 },
  "iridium-red": { color: "#b3352b", metalness: 0.9, opacity: 1 },
  goggles: { color: "#9fb2bd", metalness: 0.3, opacity: 0.5 },
};

// A driver's helmet: a sculpted shell painted with their Ferrari-era design.
// Unit-sized; the parent sets its scale and position.
export default function Helmet({
  design,
  onPointerOver,
  onPointerOut,
  onClick,
}: {
  design: HelmetDesign;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const { gl, invalidate } = useThree();
  const env = useMemo(() => studioEnvironment(gl), [gl]);
  const full = design.helmetType === "full-face";

  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = HELMET_TEX_W;
    c.height = HELMET_TEX_H;
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
  useEffect(() => {
    let live = true;
    const ctx = (texture.image as HTMLCanvasElement).getContext("2d")!;
    paintHelmet(ctx, design);
    texture.needsUpdate = true;
    invalidate();
    // Repaint once fonts are ready so names and numbers use the right face.
    loadBoardFonts().then(() => {
      if (!live) return;
      paintHelmet(ctx, design);
      texture.needsUpdate = true;
      invalidate();
    });
    return () => {
      live = false;
    };
  }, [design, texture, invalidate]);

  const parts = useMemo(() => {
    const theta = full ? SHELL_THETA : OPEN_THETA;
    // phiStart = PI puts the texture seam at the back of the helmet.
    const shell = sculpt(
      new SphereGeometry(1, 64, 36, Math.PI, Math.PI * 2, 0, Math.PI * theta),
      full,
      design.year,
    );
    if (full && shell.index) {
      // Actual eye aperture, rather than a visor painted over a solid sphere.
      const p = shell.attributes.position,
        indices = Array.from(shell.index.array);
      const kept: number[] = [];
      for (let i = 0; i < indices.length; i += 3) {
        const ids = indices.slice(i, i + 3);
        const x = ids.reduce((v, j) => v + p.getX(j), 0) / 3;
        const y = ids.reduce((v, j) => v + p.getY(j), 0) / 3;
        const z = ids.reduce((v, j) => v + p.getZ(j), 0) / 3;
        if (!(x < -0.58 && Math.abs(z) < 0.76 && y > 0.07 && y < 0.52))
          kept.push(...ids);
      }
      shell.setIndex(kept);
      shell.computeVertexNormals();
    }
    const visor = full
      ? sculpt(
          new SphereGeometry(
            1.012,
            28,
            6,
            Math.PI * 2 - 0.95,
            1.9,
            Math.PI * theta * 0.42,
            Math.PI * theta * 0.17,
          ),
          true,
          design.year,
        )
      : null;
    const rimY = Math.cos(Math.PI * theta);
    const rimR = Math.sin(Math.PI * theta);
    const seal = full
      ? sculpt(
          new SphereGeometry(
            1.016,
            36,
            8,
            Math.PI * 2 - 1.01,
            2.02,
            Math.PI * theta * 0.403,
            Math.PI * theta * 0.204,
          ),
          true,
          design.year,
        )
      : null;
    const trim = tube(
      Array.from({ length: 65 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        return [
          rimR * Math.cos(a) * 1.14,
          rimY * 1.04 + 0.04,
          rimR * Math.sin(a) * 0.92,
        ] as [number, number, number];
      }),
      0.026,
    );
    return {
      shell,
      visor,
      seal,
      trim,
      // Neck opening / inner lining.
      lining: new CylinderGeometry(
        rimR * 1.02,
        rimR * 0.96,
        0.06,
        48,
        1,
        true,
      ).translate(0, rimY, 0),
      // Front peak for 1950s helmets, a flat crescent at the rim.
      peak: design.peak
        ? new CylinderGeometry(
            1.2,
            1.08,
            0.035,
            32,
            1,
            false,
            Math.PI * 1.25,
            Math.PI * 0.5,
          ).translate(0, rimY + 0.06, 0)
        : null,
    };
  }, [full, design.peak, design.year]);
  useEffect(
    () => () => Object.values(parts).forEach((g) => g?.dispose()),
    [parts],
  );

  const mats = useMemo(() => {
    const tint = visorColors[design.visorTint];
    return {
      shell: new MeshPhysicalMaterial({
        map: texture,
        roughness: full ? 0.28 : 0.45,
        metalness: 0.05,
        clearcoat: full ? 1 : 0.4,
        clearcoatRoughness: 0.06,
        envMap: env,
        envMapIntensity: 0.7,
      }),
      inner: new MeshStandardMaterial({
        color: "#0d0e10",
        roughness: 0.9,
        side: BackSide,
      }),
      lining: new MeshStandardMaterial({ color: "#121316", roughness: 0.85 }),
      visor: new MeshPhysicalMaterial({
        color: tint.color,
        metalness: tint.metalness,
        roughness: 0.045,
        clearcoat: 1,
        clearcoatRoughness: 0.025,
        iridescence: design.visorTint.startsWith("iridium") ? 0.65 : 0,
        iridescenceIOR: 1.35,
        iridescenceThicknessRange: [120, 360],
        transparent: tint.opacity < 1,
        opacity: tint.opacity,
        envMap: env,
        envMapIntensity: 1.3,
      }),
      peak: new MeshStandardMaterial({
        color: design.peak ?? "#222",
        roughness: 0.6,
      }),
      lens: new MeshPhysicalMaterial({
        color: "#a9bcc6",
        metalness: 0.4,
        roughness: 0.05,
        envMap: env,
      }),
      frame: new MeshStandardMaterial({
        color: "#8d9095",
        metalness: 0.85,
        roughness: 0.3,
        envMap: env,
      }),
    };
  }, [design, texture, env, full]);
  useEffect(
    () => () => Object.values(mats).forEach((m) => m.dispose()),
    [mats],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  const handlers = { onPointerOver, onPointerOut, onClick };
  return (
    <group {...handlers}>
      <mesh geometry={parts.shell} material={mats.shell} castShadow />
      <mesh geometry={parts.shell} material={mats.inner} scale={0.965} />
      <mesh geometry={parts.lining} material={mats.lining} />
      <mesh geometry={parts.trim} material={mats.lining} />
      {parts.seal && <mesh geometry={parts.seal} material={mats.lining} />}
      {full && (
        <>
          {/* Tear-off posts, lower lift tab and the visor's compression gasket. */}
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[-0.86, 0.3, side * 0.56]}
              rotation={[0, side * 0.6, Math.PI / 2]}
              material={mats.frame}
            >
              <cylinderGeometry args={[0.026, 0.032, 0.036, 12]} />
            </mesh>
          ))}
          <mesh
            position={[-1.145, 0.065, 0.17]}
            rotation={[0, 0, -0.16]}
            material={mats.frame}
          >
            <boxGeometry args={[0.045, 0.048, 0.075]} />
          </mesh>
          {(design.year ?? 2000) >= 2000 && (
            <mesh
              position={[0.91, -0.23, 0]}
              rotation={[0, 0, -0.15]}
              material={mats.visor}
            >
              <boxGeometry args={[0.21, 0.026, 1.12]} />
            </mesh>
          )}
        </>
      )}
      {parts.visor && (
        <mesh geometry={parts.visor} material={mats.visor} scale={1.012} />
      )}
      {full && (
        <>
          {[-1, 1].map((side) => (
            <group key={side}>
              <group
                position={[-0.6, 0.24, side * 0.765]}
                rotation={[0, side * 0.5, 0]}
              >
                <mesh material={mats.lining} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.09, 0.09, 0.018, 24]} />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.frame}>
                  <cylinderGeometry args={[0.065, 0.065, 0.03, 24]} />
                </mesh>
                <mesh position={[0, 0, side * 0.023]} material={mats.lining}>
                  <boxGeometry args={[0.042, 0.009, 0.006]} />
                </mesh>
              </group>
              {[0, 1, 2].map((i) => (
                <mesh
                  key={i}
                  position={[
                    -1.11 + i * 0.025,
                    -0.39,
                    side * (0.12 + i * 0.085),
                  ]}
                  rotation={[0, -Math.PI / 2, 0]}
                  scale={[0.65, 1, 1]}
                  material={mats.lining}
                >
                  <capsuleGeometry args={[0.022, 0.072, 4, 8]} />
                </mesh>
              ))}
              {(design.year ?? 2000) >= 1990 && (
                <mesh
                  position={[-0.4, 0.815, side * 0.32]}
                  rotation={[0, 0, 0.22]}
                  scale={[1, 0.28, 0.55]}
                  material={mats.lining}
                >
                  <sphereGeometry args={[0.15, 16, 8]} />
                </mesh>
              )}
              {(design.year ?? 2000) >= 2003 && (
                <mesh
                  position={[0.38, -0.53, side * 0.78]}
                  rotation={[Math.PI / 2, 0, 0]}
                  material={mats.frame}
                >
                  <cylinderGeometry args={[0.052, 0.052, 0.04, 16]} />
                </mesh>
              )}
            </group>
          ))}
        </>
      )}
      {!full &&
        [-1, 1].map((side) => (
          <mesh
            key={side}
            position={[0.1, -0.44, side * 0.79]}
            scale={[0.43, 0.48, 0.055]}
            material={mats.peak}
          >
            <sphereGeometry args={[1, 20, 12]} />
          </mesh>
        ))}
      {parts.peak && (
        <mesh
          geometry={parts.peak}
          material={mats.peak}
          rotation={[0, 0, 0.1]}
        />
      )}
      {design.visorTint === "goggles" &&
        [-1, 1].map((side) => (
          <group
            key={side}
            position={[-1.02, 0.22, side * 0.27]}
            rotation={[0, -Math.PI / 2 + side * 0.25, 0]}
          >
            <mesh material={mats.frame}>
              <torusGeometry args={[0.17, 0.035, 8, 24]} />
            </mesh>
            <mesh material={mats.lens}>
              <circleGeometry args={[0.17, 24]} />
            </mesh>
          </group>
        ))}
      {!full && design.visorTint === "clear" && (
        // A clear rain shield clipped under the peak.
        <mesh
          position={[-0.02, -0.28, 0]}
          rotation={[0, 0, 0.08]}
          material={mats.visor}
        >
          <cylinderGeometry
            args={[1.12, 1.16, 0.34, 24, 1, true, Math.PI * 1.3, Math.PI * 0.4]}
          />
        </mesh>
      )}
    </group>
  );
}
