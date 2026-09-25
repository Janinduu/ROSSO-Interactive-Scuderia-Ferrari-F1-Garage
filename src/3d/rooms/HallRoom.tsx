import { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { MeshStandardMaterial } from "three";
import Helmet from "../helmets/Helmet";
import { useCanvasTexture } from "../bays/BayBoard";
import { loadBoardFonts } from "../bays/boardArt";
import { studioEnvironment } from "../studio";
import Trophy, { trophyStyleFor } from "./Trophy";
import { trophyEras } from "../../features/legacy/legacy";
import { HALL_X } from "../camera/poses";
import { helmetDesignFor } from "../../data/helmetDesigns";
import { champions, inWords, titleCount } from "../../features/hall/champions";
import type { Champion } from "../../features/hall/champions";

const PLAQUE_W = 768;
const PLAQUE_H = 384;

/** Stations stand on a shallow arc facing the entrance. */
function stationPose(i: number): { x: number; z: number; ry: number } {
  const n = champions.length;
  const t = n === 1 ? 0 : i / (n - 1) - 0.5;
  const angle = t * 1.2;
  const radius = 11.5;
  // The arc bows towards the title wall but its centre stays well in front
  // of it (the wall is at z = -5.2).
  return { x: HALL_X + Math.sin(angle) * radius, z: 9 - Math.cos(angle) * radius, ry: -angle };
}

function drawPlaque(ctx: CanvasRenderingContext2D, c: Champion, hover: boolean) {
  const W = PLAQUE_W;
  const H = PLAQUE_H;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = hover ? "#231c12" : "#16140f";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#b8924c";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.textAlign = "center";
  ctx.fillStyle = "#c9a45e";
  ctx.font = `500 30px "Barlow", Arial, sans-serif`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "8px";
  ctx.fillText(c.titles.length > 1 ? `${inWords(c.titles.length).toUpperCase()} TITLES` : "WORLD CHAMPION", W / 2, 78);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  ctx.fillStyle = "#f4ead8";
  let size = 92;
  const name = c.driver.name.toUpperCase();
  do {
    ctx.font = `600 ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`;
    size -= 4;
  } while (ctx.measureText(name).width > W - 80 && size > 40);
  ctx.fillText(name, W / 2, 190);
  ctx.fillStyle = "#e0c283";
  ctx.font = `600 58px "Barlow Condensed", "Arial Narrow", sans-serif`;
  ctx.fillText(c.titles.map((t) => t.year).join("  ·  "), W / 2, 272);
  const cars = [...new Set(c.titles.map((t) => t.car).filter(Boolean))].join(" · ");
  ctx.fillStyle = "#a89a82";
  ctx.font = `500 28px "Barlow", Arial, sans-serif`;
  ctx.fillText(cars, W / 2, 330);
}

function Plaque({ champion, hover }: { champion: Champion; hover: boolean }) {
  const { invalidate } = useThree();
  const tex = useCanvasTexture(PLAQUE_W, PLAQUE_H);
  useEffect(() => {
    let live = true;
    const paint = () => {
      if (!live) return;
      drawPlaque((tex.image as HTMLCanvasElement).getContext("2d")!, champion, hover);
      tex.needsUpdate = true;
      invalidate();
    };
    paint();
    loadBoardFonts().then(paint);
    return () => {
      live = false;
    };
  }, [tex, champion, hover, invalidate]);
  return (
    <mesh position={[0, 0.58, 0.47]} rotation={[-0.12, 0, 0]}>
      <planeGeometry args={[1.5, 0.75]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

function useHallKit() {
  const { gl } = useThree();
  const env = useMemo(() => studioEnvironment(gl), [gl]);
  const kit = useMemo(
    () => ({
      plinth: new MeshStandardMaterial({ color: "#16161a", roughness: 0.3, metalness: 0.5, envMap: env, envMapIntensity: 0.5 }),
      trim: new MeshStandardMaterial({ color: "#b8924c", roughness: 0.3, metalness: 1, envMap: env }),
    }),
    [env],
  );
  useEffect(
    () => () => {
      kit.plinth.dispose();
      kit.trim.dispose();
    },
    [kit],
  );
  return kit;
}

function Station({
  champion,
  kit,
  onSelect,
}: {
  champion: Champion;
  kit: ReturnType<typeof useHallKit>;
  onSelect: (c: Champion) => void;
}) {
  const [hover, setHover] = useState(false);
  const n = champion.titles.length;
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHover(true);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    setHover(false);
    document.body.style.cursor = "";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    out();
    onSelect(champion);
  };
  return (
    <group onPointerOver={over} onPointerOut={out} onClick={click}>
      <mesh material={kit.plinth} position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 1, 0.9]} />
      </mesh>
      <mesh material={kit.trim} position={[0, 1.005, 0]}>
        <boxGeometry args={[1.72, 0.012, 0.92]} />
      </mesh>
      <mesh material={kit.trim} position={[0, 0.02, 0]}>
        <boxGeometry args={[1.76, 0.04, 0.96]} />
      </mesh>
      <Plaque champion={champion} hover={hover} />
      {/* The champion's helmet at the centre... */}
      <group position={[0, 1.24, -0.05]} rotation={[0, 0.5, 0]} scale={0.22}>
        <Helmet design={helmetDesignFor(champion.driver)} />
      </group>
      {/* ...flanked by one trophy per Ferrari title. */}
      {champion.titles.map((t, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const rank = Math.floor(i / 2);
        const x = side * (0.42 + rank * 0.17);
        const z = -0.12 - rank * 0.14;
        return (
          <group key={t.year} position={[n === 1 ? -0.45 : x, 1.01, n === 1 ? -0.1 : z]} scale={0.95 - rank * 0.08}>
            <Trophy style={trophyStyleFor(t.year, trophyEras)} />
          </group>
        );
      })}
      {hover && <pointLight position={[0, 2.2, 1.2]} intensity={6} distance={4} color="#ffd9a0" />}
    </group>
  );
}

function drawTitle(ctx: CanvasRenderingContext2D) {
  const W = 2048;
  const H = 512;
  ctx.clearRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#c9a45e";
  ctx.font = `500 54px "Barlow", Arial, sans-serif`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "18px";
  ctx.fillText("SCUDERIA FERRARI · DRIVERS' WORLD CHAMPIONS", W / 2, 120);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  const g = ctx.createLinearGradient(0, 170, 0, 420);
  g.addColorStop(0, "#fbe6b8");
  g.addColorStop(1, "#c79a4a");
  ctx.fillStyle = g;
  ctx.shadowColor = "rgba(216,178,90,0.5)";
  ctx.shadowBlur = 50;
  ctx.font = `600 230px "Barlow Condensed", "Arial Narrow", sans-serif`;
  ctx.fillText("HALL OF CHAMPIONS", W / 2, 390);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#a89a82";
  ctx.font = `500 44px "Barlow", Arial, sans-serif`;
  ctx.fillText(`${inWords(titleCount)} titles  ·  ${inWords(champions.length)} champions  ·  1952 — 2007`, W / 2, 470);
}

// The end of the corridor: a warm, gilded room with one station per champion.
export default function HallRoom({
  active,
  onSelect,
}: {
  active: boolean;
  onSelect: (c: Champion) => void;
}) {
  const { invalidate } = useThree();
  const title = useCanvasTexture(2048, 512);
  useEffect(() => {
    let live = true;
    const paint = () => {
      if (!live) return;
      drawTitle((title.image as HTMLCanvasElement).getContext("2d")!);
      title.needsUpdate = true;
      invalidate();
    };
    paint();
    loadBoardFonts().then(paint);
    return () => {
      live = false;
    };
  }, [title, invalidate]);
  useEffect(() => () => void (document.body.style.cursor = ""), []);

  const x = HALL_X;
  return (
    <group>
      {/* Walls and a warm floor inlay. */}
      <mesh position={[x, 3, -5.2]}>
        <boxGeometry args={[26, 6, 0.3]} />
        <meshStandardMaterial color="#1a1712" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[x, 4.35, -5.02]}>
        <planeGeometry args={[14, 3.5]} />
        <meshBasicMaterial map={title} transparent toneMapped={false} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[x + side * 13, 3, 1]}>
          <boxGeometry args={[0.3, 6, 12.5]} />
          <meshStandardMaterial color="#1a1712" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[x, 0.012, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8.2, 8.26, 128, 1, Math.PI * 1.1, Math.PI * 0.8]} />
        <meshBasicMaterial color="#b8924c" />
      </mesh>
      <mesh position={[x - 13, 0.012, 1.5]}>
        <boxGeometry args={[0.04, 0.012, 11]} />
        <meshBasicMaterial color="#b8924c" />
      </mesh>
      {active && <Stations onSelect={onSelect} />}
      <pointLight position={[x, 5.5, 3]} intensity={active ? 40 : 0} color="#ffe2b0" distance={20} />
      <pointLight position={[x - 7, 3, 0]} intensity={active ? 14 : 0} color="#ffcf8a" distance={12} />
      <pointLight position={[x + 7, 3, 0]} intensity={active ? 14 : 0} color="#ffcf8a" distance={12} />
    </group>
  );
}

function Stations({ onSelect }: { onSelect: (c: Champion) => void }) {
  const kit = useHallKit();
  const { invalidate } = useThree();
  useEffect(() => invalidate(), [invalidate]);
  return (
    <>
      {champions.map((c, i) => {
        const p = stationPose(i);
        return (
          <group key={c.driver.id} position={[p.x, 0, p.z]} rotation={[0, p.ry, 0]}>
            <Station champion={c} kit={kit} onSelect={onSelect} />
          </group>
        );
      })}
    </>
  );
}
