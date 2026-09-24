import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  RingGeometry,
  SphereGeometry,
} from "three";
import type { BufferGeometry as Geometry, InstancedMesh, Material } from "three";
import { drivers, eras } from "../../data/drivers";
import { helmetPalette } from "../../data/helmets";
import { bayX } from "../camera/poses";
import { BayBoard, ChapterMarker } from "./BayBoard";
import { WallSign, useWallSignTextures } from "./WallSign";
import type { BayState } from "./boardArt";

type V3 = [number, number, number];
interface Placement {
  p: V3;
  r?: V3;
  s?: V3;
  color?: string;
}

/** Bays within this distance of the selected one get their full identity board. */
const BOARD_RANGE = 3;
/** Front-right of the plinth, clear of the car from the usual viewpoint. */
const PEDESTAL: V3 = [3.75, 0, 1.5];
const HELMET_R = 0.25;
const HELMET_Y = 1.08 + HELMET_R * 0.77;
/** Turn the helmets' visors towards the visitor's usual viewpoint. */
const HELMET_TURN = 0.93;

const chapterOf = (i: number) => eras.indexOf(drivers[i].era) + 1;
const chapterStarts = drivers
  .map((d, i) => ({ i, first: i === 0 || drivers[i - 1].era !== d.era }))
  .filter((c) => c.first)
  .map((c) => c.i);

// Shared geometry and materials for every bay, created once and disposed with
// the corridor.
function useBayKit() {
  const kit = useMemo(() => {
    const standard = (color: string, metalness: number, roughness: number) =>
      new MeshStandardMaterial({ color, metalness, roughness });
    const basic = (color: string) => new MeshBasicMaterial({ color });
    return {
      geo: {
        wall: new BoxGeometry(8.92, 5, 0.2),
        pillar: new BoxGeometry(0.13, 5, 0.3),
        groove: new BoxGeometry(8.7, 0.014, 0.025),
        wallLine: new BoxGeometry(7.8, 0.025, 0.024),
        sideLine: new BoxGeometry(0.025, 0.015, 5),
        lightBar: new BoxGeometry(6.4, 0.025, 0.16),
        plinth: new CylinderGeometry(3.15, 3.15, 0.025, 72),
        backing: new BoxGeometry(5, 2.6, 0.04),
        pedestal: new CylinderGeometry(0.19, 0.22, 1.05, 32),
        plate: new CylinderGeometry(0.27, 0.27, 0.03, 32),
        glow: new RingGeometry(0.34, 0.4, 48),
        threshold: new BoxGeometry(0.035, 0.012, 11),
        shell: new SphereGeometry(HELMET_R, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.78),
        visor: new SphereGeometry(HELMET_R * 1.012, 24, 6, -0.95, 1.9, Math.PI * 0.4, Math.PI * 0.2),
        band: new SphereGeometry(HELMET_R * 1.006, 32, 2, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.05),
        crownFront: new SphereGeometry(HELMET_R * 1.009, 4, 12, -0.14, 0.28, 0, Math.PI * 0.4),
        crownBack: new SphereGeometry(HELMET_R * 1.009, 4, 12, Math.PI - 0.14, 0.28, 0, Math.PI * 0.4),
        chin: new CylinderGeometry(HELMET_R * 0.66, HELMET_R * 0.6, 0.05, 32),
      },
      mat: {
        wall: standard("#1d2024", 0.55, 0.48),
        pillar: standard("#34363b", 0.6, 0.4),
        groove: basic("#36383b"),
        wallLine: basic("#be252e"),
        sideLine: basic("#733137"),
        lightBar: basic("#eeeae0"),
        lightBarRear: basic("#aaa9a0"),
        plinth: standard("#33353a", 0.35, 0.6),
        backing: standard("#141518", 0.4, 0.6),
        pedestal: standard("#2a2c30", 0.7, 0.35),
        plate: standard("#4a4d52", 0.85, 0.25),
        glow: basic("#ffffff"),
        threshold: basic("#9e2830"),
        paint: standard("#ffffff", 0.15, 0.28),
        visor: standard("#0c0d0f", 0.6, 0.12),
        chin: standard("#111214", 0.3, 0.6),
        outline: new LineBasicMaterial({ color: "#7a2a31" }),
      },
    };
  }, []);
  useEffect(
    () => () => {
      Object.values(kit.geo).forEach((g) => g.dispose());
      Object.values(kit.mat).forEach((m) => m.dispose());
    },
    [kit],
  );
  return kit;
}

function Instances({
  geometry,
  material,
  items,
  onPointerOver,
  onPointerOut,
  onClick,
}: {
  geometry: Geometry;
  material: Material;
  items: Placement[];
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const ref = useRef<InstancedMesh>(null);
  const { invalidate } = useThree();
  useLayoutEffect(() => {
    const mesh = ref.current!;
    const o = new Object3D();
    const c = new Color();
    items.forEach((it, i) => {
      o.position.set(...it.p);
      o.rotation.set(...(it.r ?? [0, 0, 0]));
      o.scale.set(...(it.s ?? [1, 1, 1]));
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      if (it.color) mesh.setColorAt(i, c.set(it.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    invalidate();
  }, [items, invalidate]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    />
  );
}

// Top-view car outline drawn on empty plinths: the bay reads as a place for a
// car before any car is loaded (spec §7.2).
const outlineTemplate = (() => {
  const body: [number, number][] = [
    [-2.45, 0.08], [-1.2, 0.2], [-0.5, 0.35], [-0.2, 0.72], [0.9, 0.72],
    [1.5, 0.45], [2.2, 0.5], [2.2, -0.5], [1.5, -0.45], [0.9, -0.72],
    [-0.2, -0.72], [-0.5, -0.35], [-1.2, -0.2], [-2.45, -0.08],
  ];
  const rect = (x0: number, z0: number, x1: number, z1: number) =>
    [[x0, z0], [x1, z0], [x1, z1], [x0, z1]] as [number, number][];
  const loops = [
    body,
    rect(-2.52, -1.0, -2.12, 1.0),
    rect(1.72, -0.85, 2.26, 0.85),
    rect(-1.94, 0.84, -1.06, 1.22),
    rect(-1.94, -1.22, -1.06, -0.84),
    rect(0.99, 0.78, 1.87, 1.28),
    rect(0.99, -1.28, 1.87, -0.78),
  ];
  const segments: number[] = [];
  for (const loop of loops)
    loop.forEach(([x, z], i) => {
      const [nx, nz] = loop[(i + 1) % loop.length];
      segments.push(x, 0.034, z, nx, 0.034, nz);
    });
  return segments;
})();

export default function Corridor({
  current,
  onSelect,
}: {
  current: number;
  onSelect: (index: number) => void;
}) {
  const kit = useBayKit();
  const signs = useWallSignTextures();
  const [hovered, setHovered] = useState<number | null>(null);
  const stateOf = (i: number): BayState =>
    i === current ? "selected" : i === hovered ? "hover" : "idle";

  useEffect(() => () => void (document.body.style.cursor = ""), []);
  const over = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(i);
    document.body.style.cursor = i === current ? "" : "pointer";
  };
  const out = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered((h) => (h === i ? null : h));
    document.body.style.cursor = "";
  };
  const click = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Ignore the click that ends an orbit drag.
    if (e.delta > 6 || i === current) return;
    onSelect(i);
  };
  const byInstance =
    <E extends ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>>(
      handler: (i: number) => (e: E) => void,
    ) =>
    (e: E) =>
      e.instanceId !== undefined && handler(e.instanceId)(e);

  const at = (i: number, local: V3): V3 => [bayX(i) + local[0], local[1], local[2]];
  const each = (local: V3, extra: Omit<Placement, "p"> = {}) =>
    drivers.map((_, i) => ({ p: at(i, local), ...extra }));

  // Static structure: identical for every bay, so each part is one draw call.
  const structure = useMemo(
    () => ({
      wall: each([0, 2.5, -4]),
      pillar: drivers.flatMap((_, i) => [
        { p: at(i, [-4.4, 2.5, -3.85]) },
        { p: at(i, [4.4, 2.5, -3.85]) },
      ]),
      groove: drivers.flatMap((_, i) =>
        [1, 2, 3, 4].map((y) => ({ p: at(i, [0, y, -3.86]) })),
      ),
      wallLine: each([0, 0.02, -2.5]),
      sideLine: drivers.flatMap((_, i) => [
        { p: at(i, [-3.9, 0.015, 0]) },
        { p: at(i, [3.9, 0.015, 0]) },
      ]),
      lightBar: each([0, 4.7, 0]),
      lightBarRear: each([0, 4.7, -2.3], { s: [1, 1, 0.75] }),
      plinth: each([0, 0.015, 0]),
      backing: each([0, 2.75, -3.88]),
      pedestal: each([PEDESTAL[0], 0.525, PEDESTAL[2]]),
      plate: each([PEDESTAL[0], 1.065, PEDESTAL[2]]),
      threshold: chapterStarts
        .filter((i) => i > 0)
        .map((i) => ({ p: [bayX(i) - 4.5, 0.012, 1.5] as V3 })),
    }),
    // The layout depends only on the fixed driver list.
    [],
  );

  const helmets = useMemo(() => {
    const place = (color?: string) =>
      drivers.map((_, i) => ({
        p: at(i, [PEDESTAL[0], HELMET_Y, PEDESTAL[2]]),
        r: [0, HELMET_TURN, 0] as V3,
        s: [1.12, 1, 1] as V3,
        color,
      }));
    const palette = drivers.map((d) => helmetPalette(d.flag));
    const painted = (key: "shell" | "band" | "crown") =>
      place().map((p, i) => ({ ...p, color: palette[i][key] }));
    return {
      shell: painted("shell"),
      band: painted("band"),
      crown: painted("crown"),
      plain: place(),
      chin: drivers.map((_, i) => ({
        p: at(i, [PEDESTAL[0], HELMET_Y - HELMET_R * 0.77, PEDESTAL[2]]),
        r: [0, HELMET_TURN, 0] as V3,
        s: [1.12, 1, 1] as V3,
      })),
    };
  }, []);

  const glow = useMemo(
    () =>
      drivers.map((_, i) => ({
        p: at(i, [PEDESTAL[0], 0.012, PEDESTAL[2]]),
        r: [-Math.PI / 2, 0, 0] as V3,
        color:
          i === current ? "#e33a3f" : i === hovered ? "#b22f36" : "#3a1c1f",
      })),
    [current, hovered],
  );

  const outlines = useMemo(() => {
    const g = new BufferGeometry();
    const points: number[] = [];
    drivers.forEach((_, i) => {
      if (i === current) return;
      for (let k = 0; k < outlineTemplate.length; k += 3)
        points.push(
          outlineTemplate[k] + bayX(i),
          outlineTemplate[k + 1],
          outlineTemplate[k + 2],
        );
    });
    g.setAttribute("position", new Float32BufferAttribute(points, 3));
    return g;
  }, [current]);
  useEffect(() => () => outlines.dispose(), [outlines]);

  const bayHandlers = {
    onPointerOver: byInstance(over),
    onPointerOut: byInstance(out),
    onClick: byInstance(click),
  };
  const s = structure;
  const { geo, mat } = kit;
  return (
    <group>
      <mesh position={[bayX(8), -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 45]} />
        <meshStandardMaterial color="#24262a" metalness={0.4} roughness={0.6} />
      </mesh>
      <Instances geometry={geo.wall} material={mat.wall} items={s.wall} />
      <Instances geometry={geo.pillar} material={mat.pillar} items={s.pillar} />
      <Instances geometry={geo.groove} material={mat.groove} items={s.groove} />
      <Instances geometry={geo.wallLine} material={mat.wallLine} items={s.wallLine} />
      <Instances geometry={geo.sideLine} material={mat.sideLine} items={s.sideLine} />
      <Instances geometry={geo.lightBar} material={mat.lightBar} items={s.lightBar} />
      <Instances geometry={geo.lightBar} material={mat.lightBarRear} items={s.lightBarRear} />
      <Instances geometry={geo.backing} material={mat.backing} items={s.backing} />
      <Instances geometry={geo.threshold} material={mat.threshold} items={s.threshold} />
      <Instances geometry={geo.plinth} material={mat.plinth} items={s.plinth} {...bayHandlers} />
      <Instances geometry={geo.pedestal} material={mat.pedestal} items={s.pedestal} {...bayHandlers} />
      <Instances geometry={geo.plate} material={mat.plate} items={s.plate} />
      <Instances geometry={geo.glow} material={mat.glow} items={glow} />
      <Instances geometry={geo.shell} material={mat.paint} items={helmets.shell} {...bayHandlers} />
      <Instances geometry={geo.band} material={mat.paint} items={helmets.band} />
      <Instances geometry={geo.crownFront} material={mat.paint} items={helmets.crown} />
      <Instances geometry={geo.crownBack} material={mat.paint} items={helmets.crown} />
      <Instances geometry={geo.visor} material={mat.visor} items={helmets.plain} />
      <Instances geometry={geo.chin} material={mat.chin} items={helmets.chin} />
      <lineSegments geometry={outlines} material={mat.outline} />
      {chapterStarts.map((i) => (
        <ChapterMarker
          key={i}
          chapter={chapterOf(i)}
          title={drivers[i].era}
          x={bayX(i) - 4.5}
        />
      ))}
      {drivers.map((d, i) =>
        Math.abs(i - current) <= BOARD_RANGE ? (
          <group key={d.id} position={[bayX(i), 0, 0]}>
            <BayBoard
              driver={d}
              chapter={chapterOf(i)}
              state={stateOf(i)}
              onPointerOver={over(i)}
              onPointerOut={out(i)}
              onClick={click(i)}
            />
            {signs && <WallSign textures={signs} state={stateOf(i)} />}
          </group>
        ) : null,
      )}
    </group>
  );
}
