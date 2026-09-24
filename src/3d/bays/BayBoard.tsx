import { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { CanvasTexture, SRGBColorSpace } from "three";
import type { Driver } from "../../data/drivers";
import { getPortrait, teamEmblemSrc } from "../../data/media";
import {
  BOARD_H,
  BOARD_W,
  CHAPTER_H,
  CHAPTER_W,
  drawBoard,
  drawChapter,
  loadBoardFonts,
  loadImage,
} from "./boardArt";
import type { BayState } from "./boardArt";

function useCanvasTexture(width: number, height: number) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [width, height]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

const tint: Record<BayState, string> = {
  idle: "#8c8c8c",
  hover: "#dedede",
  selected: "#ffffff",
};

// The identity board on a bay's back wall: portrait, name, years, era, hook.
export function BayBoard({
  driver,
  chapter,
  state,
  onPointerOver,
  onPointerOut,
  onClick,
}: {
  driver: Driver;
  chapter: number;
  state: BayState;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const { invalidate } = useThree();
  const texture = useCanvasTexture(BOARD_W, BOARD_H);
  const [media, setMedia] = useState<{
    portrait: HTMLImageElement | null;
    emblem: HTMLImageElement | null;
    fonts: boolean;
  }>({ portrait: null, emblem: null, fonts: false });
  const record = getPortrait(driver.id);

  useEffect(() => {
    let live = true;
    Promise.all([
      loadBoardFonts(),
      record ? loadImage(record.src) : null,
      teamEmblemSrc ? loadImage(teamEmblemSrc) : null,
    ]).then(([, portrait, emblem]) => {
      if (live) setMedia({ portrait, emblem, fonts: true });
    });
    return () => {
      live = false;
    };
  }, [record]);

  useEffect(() => {
    const ctx = (texture.image as HTMLCanvasElement).getContext("2d")!;
    drawBoard(ctx, {
      driver,
      chapter,
      portrait: media.portrait,
      focal: record?.focalPoint ?? [0.5, 0.3],
      emblem: media.emblem,
      state,
    });
    texture.needsUpdate = true;
    invalidate();
  }, [texture, driver, chapter, media, state, record, invalidate]);

  return (
    <mesh
      position={[0, 2.75, -3.83]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <planeGeometry args={[4.8, 2.4]} />
      <meshBasicMaterial map={texture} color={tint[state]} toneMapped={false} />
    </mesh>
  );
}

// A tall marker on the wall where a new chapter of the museum begins.
export function ChapterMarker({
  chapter,
  title,
  x,
}: {
  chapter: number;
  title: string;
  x: number;
}) {
  const { invalidate } = useThree();
  const texture = useCanvasTexture(CHAPTER_W, CHAPTER_H);
  useEffect(() => {
    let live = true;
    loadBoardFonts().then(() => {
      if (!live) return;
      drawChapter(
        (texture.image as HTMLCanvasElement).getContext("2d")!,
        chapter,
        title,
      );
      texture.needsUpdate = true;
      invalidate();
    });
    return () => {
      live = false;
    };
  }, [texture, chapter, title, invalidate]);
  return (
    <mesh position={[x, 2.6, -3.62]}>
      <planeGeometry args={[0.72, 2.88]} />
      <meshBasicMaterial map={texture} color="#b8b8b8" toneMapped={false} />
    </mesh>
  );
}
