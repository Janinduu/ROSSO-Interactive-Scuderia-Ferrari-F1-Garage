import { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import { CanvasTexture, Color, MeshPhysicalMaterial, MeshStandardMaterial, SRGBColorSpace } from "three";
import type { Texture } from "three";
import type { Livery, Slot, Zone } from "../../data/liveries";
import { teamShieldSrc } from "../../data/media";
import { loadBoardFonts, loadImage } from "../bays/boardArt";

type V3 = [number, number, number];

const finishes = {
  gloss: { roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.1 },
  satin: { roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.35 },
  matte: { roughness: 0.72, clearcoat: 0, clearcoatRoughness: 1 },
};

/** One material per distinct livery colour, shared across zones. */
export function useLiveryMaterials(env: Texture, livery: Livery) {
  const mats = useMemo(() => {
    const cache = new Map<string, MeshPhysicalMaterial>();
    const paint = (color: string) => {
      let m = cache.get(color);
      if (!m) {
        m = new MeshPhysicalMaterial({
          color: new Color(color).multiplyScalar(0.78),
          metalness: 0.05,
          envMap: env,
          envMapIntensity: 0.32,
          ...finishes[livery.finish ?? "gloss"],
        });
        cache.set(color, m);
      }
      return m;
    };
    const base = paint(livery.base);
    const zone = (z: Zone) => (livery.zones[z] ? paint(livery.zones[z]!) : null);
    const rim = livery.zones.wheels
      ? new MeshStandardMaterial({ color: livery.zones.wheels, metalness: 0.7, roughness: 0.3, envMap: env })
      : null;
    return { base, zone, paint, rim, all: cache };
  }, [env, livery]);
  useEffect(
    () => () => {
      mats.all.forEach((m) => m.dispose());
      mats.rim?.dispose();
    },
    [mats],
  );
  return mats;
}
export type LiveryMats = ReturnType<typeof useLiveryMaterials>;

/** Width : height of each decal slot's artwork. */
export const SLOT_ASPECT: Record<Slot, number> = {
  noseTop: 3.4,
  noseSide: 3,
  sidepodSide: 3.4,
  engineCoverSide: 3,
  rearWingTop: 4.5,
  rearWingEndplate: 2.2,
  frontWingEndplate: 2.6,
  cockpitSide: 2.2,
};

type Item =
  | { kind: "text"; text: string; color: string; background?: string | null }
  | { kind: "number"; value: number; roundel: boolean }
  | { kind: "shield" };

function itemsFor(livery: Livery, slot: Slot, number: number | null, roundel: boolean): Item[] {
  const items: Item[] = [];
  if (livery.shield?.includes(slot)) items.push({ kind: "shield" });
  if (number != null && livery.numberSlot === slot) items.push({ kind: "number", value: number, roundel });
  for (const d of livery.decals ?? [])
    if (d.slot === slot) items.push({ kind: "text", text: d.text, color: d.color, background: d.background });
  return items;
}

function paintSlot(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  items: Item[],
  shield: HTMLImageElement | null,
) {
  ctx.clearRect(0, 0, W, H);
  const shown = items.filter((i) => i.kind !== "shield" || shield);
  if (!shown.length) return false;
  // Shields and numbers take a square cell; sponsor names share the rest.
  const squares = shown.filter((i) => i.kind !== "text").length;
  const texts = shown.length - squares;
  const square = Math.min(H, W / Math.max(1, shown.length));
  const textW = texts ? (W - squares * square) / texts : 0;
  let x = 0;
  for (const item of shown) {
    const cw = item.kind === "text" ? textW : square;
    const pad = H * 0.08;
    if (item.kind === "shield" && shield) {
      const s = Math.min((cw - pad * 2) / shield.width, (H - pad * 2) / shield.height);
      ctx.drawImage(shield, x + (cw - shield.width * s) / 2, (H - shield.height * s) / 2, shield.width * s, shield.height * s);
    } else if (item.kind === "number") {
      const r = (H - pad * 2) / 2;
      if (item.roundel) {
        ctx.fillStyle = "#f4f2ec";
        ctx.beginPath();
        ctx.arc(x + cw / 2, H / 2, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = item.roundel ? "#111" : "#f7f5ef";
      ctx.font = `700 ${r * 1.45}px "Barlow Condensed", Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(item.value), x + cw / 2, H / 2 + r * 0.06);
    } else if (item.kind === "text") {
      if (item.background) {
        ctx.fillStyle = item.background;
        ctx.fillRect(x + pad * 0.5, pad, cw - pad, H - pad * 2);
      }
      ctx.fillStyle = item.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let size = H * 0.62;
      do {
        ctx.font = `700 ${size}px "Barlow Condensed", Arial, sans-serif`;
        size -= 2;
      } while (ctx.measureText(item.text).width > cw - pad * 2.5 && size > 8);
      ctx.fillText(item.text, x + cw / 2, H / 2 + size * 0.04);
    }
    x += cw;
  }
  return true;
}

/** Composed artwork for every slot the livery uses; null for empty slots. */
export function useSlotTextures(livery: Livery, number: number | null, roundel: boolean) {
  const { invalidate } = useThree();
  const [shield, setShield] = useState<HTMLImageElement | null>(null);
  const [fonts, setFonts] = useState(false);
  useEffect(() => {
    let live = true;
    Promise.all([loadBoardFonts(), teamShieldSrc ? loadImage(teamShieldSrc) : null]).then(([, img]) => {
      if (!live) return;
      setShield(img);
      setFonts(true);
    });
    return () => {
      live = false;
    };
  }, []);
  const textures = useMemo(() => {
    const out: Partial<Record<Slot, Texture>> = {};
    for (const slot of Object.keys(SLOT_ASPECT) as Slot[]) {
      const items = itemsFor(livery, slot, number, roundel);
      if (!items.length) continue;
      const H = 160;
      const W = Math.round(H * SLOT_ASPECT[slot]);
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      if (!paintSlot(c.getContext("2d")!, W, H, items, shield)) continue;
      const t = new CanvasTexture(c);
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 4;
      out[slot] = t;
    }
    return out;
    // fonts is a dependency so artwork is repainted once the typeface loads.
  }, [livery, number, roundel, shield, fonts]);
  useEffect(() => {
    invalidate();
    return () => Object.values(textures).forEach((t) => t?.dispose());
  }, [textures, invalidate]);
  return textures;
}

/** A flat decal. Pass `side` for body sides so each side reads correctly. */
export function Decal({
  texture,
  slot,
  height,
  position,
  facing,
  tilt = 0,
}: {
  texture: Texture | undefined;
  slot: Slot;
  height: number;
  position: V3;
  /** "left" (+Z), "right" (-Z), "up" (top surface, text along the car), "back" (wing top). */
  facing: "left" | "right" | "up" | "back";
  /** Pitch of the surface, radians about Z. */
  tilt?: number;
}) {
  if (!texture) return null;
  const width = height * SLOT_ASPECT[slot];
  const inner: V3 =
    facing === "right" ? [0, Math.PI, 0] : facing === "left" ? [0, 0, 0] : [-Math.PI / 2, 0, 0];
  return (
    <group position={position} rotation={[0, facing === "back" ? Math.PI / 2 : 0, tilt]}>
      <mesh rotation={inner} renderOrder={2}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          transparent
          roughness={0.4}
          polygonOffset
          polygonOffsetFactor={-4}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
