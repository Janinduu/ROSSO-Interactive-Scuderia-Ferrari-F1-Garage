import { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, SRGBColorSpace } from "three";
import type { Texture } from "three";
import { teamEmblemSrc } from "../../data/media";
import { SIGN_H, SIGN_W, drawWordmark, loadImage } from "./boardArt";
import { useCanvasTexture } from "./BayBoard";
import type { BayState } from "./boardArt";

/** Shared textures for every wall sign, or null when no emblem is installed. */
export function useWallSignTextures() {
  const { invalidate } = useThree();
  const mark = useCanvasTexture(SIGN_W, SIGN_H);
  const [ready, setReady] = useState(false);
  // Soft red light spill on the wall behind the sign.
  const halo = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 64, 4, 128, 64, 128);
    g.addColorStop(0, "rgba(227,40,48,0.55)");
    g.addColorStop(0.45, "rgba(227,40,48,0.16)");
    g.addColorStop(1, "rgba(227,40,48,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => halo.dispose(), [halo]);
  useEffect(() => {
    let live = true;
    loadImage(teamEmblemSrc).then((img) => {
      if (!img || !live) return;
      drawWordmark((mark.image as HTMLCanvasElement).getContext("2d")!, img);
      mark.needsUpdate = true;
      setReady(true);
      invalidate();
    });
    return () => {
      live = false;
    };
  }, [mark, invalidate]);
  return ready ? { mark, halo } : null;
}

const strength: Record<BayState, number> = { idle: 0.45, hover: 0.75, selected: 1 };

// A backlit team sign above the bay's identity board.
export function WallSign({
  textures,
  state,
}: {
  textures: { mark: Texture; halo: Texture };
  state: BayState;
}) {
  const k = strength[state];
  return (
    <group position={[0, 4.36, 0]}>
      <mesh position={[0, 0, -3.87]}>
        <planeGeometry args={[4.2, 1.3]} />
        <meshBasicMaterial
          map={textures.halo}
          transparent
          opacity={k}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, -3.84]}>
        <planeGeometry args={[2.3, 0.575]} />
        <meshBasicMaterial
          map={textures.mark}
          transparent
          opacity={0.55 + 0.45 * k}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
