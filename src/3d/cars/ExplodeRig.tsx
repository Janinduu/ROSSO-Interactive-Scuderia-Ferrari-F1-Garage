import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Vector3 } from "three";
import type { Group, Material, Mesh, Object3D } from "three";
import type { PartId } from "../../data/engineering";
import { EXPLODE, EXPLODE_MS, PART_GROUPS, explodeState, groupProgress } from "./explode";

const KNOWN = Object.keys(EXPLODE);
const HIGHLIGHT = new Color("#ff5a3c");

// Drives the exploded view, component highlight and isolation by moving the
// car's named groups directly — React never re-renders the car mid-animation.
export default function ExplodeRig({
  root,
  exploded,
  selected,
  isolate,
  reduced,
  carKey,
}: {
  root: RefObject<Group | null>;
  exploded: boolean;
  selected: PartId | null;
  isolate: boolean;
  reduced: boolean;
  carKey: string;
}) {
  const { invalidate } = useThree();
  const originals = useRef(new Map<Mesh, Material | Material[]>());

  useEffect(() => {
    invalidate();
  }, [exploded, invalidate]);

  useFrame((_, delta) => {
    const car = root.current;
    if (!car) return;
    const goal = exploded ? 1 : 0;
    const p = explodeState.progress;
    if (p !== goal) {
      const step = reduced ? 1 : Math.min(delta, 1 / 30) / (EXPLODE_MS / 1000);
      explodeState.progress = goal > p ? Math.min(goal, p + step) : Math.max(goal, p - step);
      invalidate();
    }
    // Apply offsets every frame the car is open: a React re-render may have
    // reset a group to its authored position.
    if (explodeState.progress === 0 && p === 0) return;
    for (const name of KNOWN) {
      const obj = car.getObjectByName(name);
      if (!obj) continue;
      const base = (obj.userData.base ??= obj.position.clone()) as Vector3;
      const k = groupProgress(name, explodeState.progress);
      const o = EXPLODE[name].offset;
      obj.position.set(base.x + o[0] * k, base.y + o[1] * k, base.z + o[2] * k);
    }
  });

  // Highlight the selected component and, optionally, isolate it.
  useEffect(() => {
    const car = root.current;
    if (!car) return;
    const keep = new Set(selected ? PART_GROUPS[selected] : []);
    const restore = () => {
      originals.current.forEach((mat, mesh) => {
        const current = mesh.material as Material;
        if (current !== mat) current.dispose();
        mesh.material = mat;
      });
      originals.current.clear();
    };
    restore();
    // Isolation shows only the chosen component; the groups above it stay
    // visible (visibility is inherited) but their other contents are hidden.
    const body = car.getObjectByName("car_root") ?? car;
    const showAll = (o: Object3D) => o.traverse((c) => (c.visible = true));
    const isolateFrom = (o: Object3D): boolean => {
      if (keep.has(o.name)) {
        showAll(o);
        return true;
      }
      let any = false;
      for (const child of o.children) if (isolateFrom(child)) any = true;
      o.visible = any;
      return any;
    };
    if (isolate && selected) {
      isolateFrom(body);
      body.visible = true;
    } else showAll(body);
    if (selected)
      for (const name of keep) {
        const g = car.getObjectByName(name);
        g?.traverse((o) => {
          const mesh = o as Mesh;
          if (!mesh.isMesh) return;
          originals.current.set(mesh, mesh.material);
          const tint = (m: Material) => {
            const c = m.clone() as Material & { emissive?: Color; emissiveIntensity?: number };
            if (c.emissive) {
              c.emissive = HIGHLIGHT.clone();
              c.emissiveIntensity = 0.16;
            }
            return c;
          };
          mesh.material = Array.isArray(mesh.material) ? mesh.material.map(tint) : tint(mesh.material);
        });
      }
    invalidate();
    return restore;
  }, [root, selected, isolate, carKey, invalidate]);

  return null;
}
