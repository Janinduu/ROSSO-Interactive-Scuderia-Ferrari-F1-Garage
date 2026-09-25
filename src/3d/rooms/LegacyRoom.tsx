import { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { CanvasTexture, MeshStandardMaterial, SRGBColorSpace } from "three";
import { useCanvasTexture } from "../bays/BayBoard";
import { loadBoardFonts, loadImage } from "../bays/boardArt";
import { teamShieldSrc } from "../../data/media";
import { LEGACY_X } from "../camera/poses";
import Trophy, { trophyStyleFor } from "./Trophy";
import {
  longestRun,
  titles,
  useLegacyStore,
} from "../../features/legacy/legacy";
import { inWords } from "../../features/hall/champions";

/** Plinth position for the i-th title: the eras before 1999 stand on a raised
 * back tier, the dream-team era and after on the front tier. */
export function legacyPlinth(i: number) {
  const back = titles[i].year < 1999;
  const row = titles.filter((t) => t.year < 1999 === back);
  const k = row.findIndex((t) => t.year === titles[i].year);
  const spacing = 1.7;
  return {
    x: LEGACY_X + (k - (row.length - 1) / 2) * spacing,
    y: back ? 0.7 : 0,
    z: back ? -3.4 : -0.4,
  };
}

function drawWall(
  ctx: CanvasRenderingContext2D,
  shield: HTMLImageElement | null,
) {
  const W = 2048;
  const H = 1024;
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(
    W / 2,
    H * 0.45,
    40,
    W / 2,
    H * 0.5,
    W * 0.6,
  );
  bg.addColorStop(0, "#7a0d15");
  bg.addColorStop(1, "#1c0406");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  // The team shield (installed locally) crowns the wall, with a warm glow.
  let nameY = 130;
  if (shield) {
    const h = 190;
    const w = (shield.width / shield.height) * h;
    const glow = ctx.createRadialGradient(W / 2, 125, 10, W / 2, 125, 230);
    glow.addColorStop(0, "rgba(255,200,90,0.35)");
    glow.addColorStop(1, "rgba(255,200,90,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(W / 2 - 260, 0, 520, 280);
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 24;
    ctx.drawImage(shield, W / 2 - w / 2, 30, w, h);
    ctx.shadowBlur = 0;
    nameY = 272;
  }
  ctx.fillStyle = "#d9b86e";
  ctx.font = `500 52px "Barlow", Arial, sans-serif`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "20px";
  ctx.fillText("SCUDERIA FERRARI", W / 2, nameY);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  // The number, monumental and gilded.
  const g = ctx.createLinearGradient(0, 200, 0, 760);
  g.addColorStop(0, "#fff0c8");
  g.addColorStop(0.5, "#e2b85e");
  g.addColorStop(1, "#9c6f25");
  ctx.fillStyle = g;
  ctx.shadowColor = "rgba(255,196,90,0.55)";
  ctx.shadowBlur = 80;
  // Slightly smaller when the shield takes the top of the wall.
  ctx.font = `600 ${shield ? 470 : 600}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  ctx.fillText(String(titles.length), W / 2, shield ? 750 : 740);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#f3e2bd";
  ctx.font = `600 96px "Barlow Condensed", "Arial Narrow", sans-serif`;
  ctx.fillText("CONSTRUCTORS' WORLD CHAMPIONSHIPS", W / 2, 860);
  ctx.fillStyle = "#d9b86e";
  ctx.font = `500 44px "Barlow", Arial, sans-serif`;
  ctx.fillText(
    `${titles[0].year} — ${titles.at(-1)!.year}  ·  ${inWords(longestRun[1] - longestRun[0] + 1)} in a row, ${longestRun[0]} — ${longestRun[1]}`,
    W / 2,
    940,
  );
}

function bannerTexture(year: number) {
  const W = 256;
  const H = 768;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#a3101b");
  g.addColorStop(1, "#5c070d");
  ctx.fillStyle = g;
  // A swallow-tail banner.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, H);
  ctx.lineTo(W / 2, H - 90);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#d9b86e";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = "#e6c479";
  ctx.fillRect(28, 60, W - 56, 4);
  ctx.textAlign = "center";
  ctx.font = `500 30px "Barlow", Arial, sans-serif`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "6px";
  ctx.fillText("CAMPIONI", W / 2, 120);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  ctx.save();
  ctx.translate(W / 2, 390);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `600 170px "Barlow Condensed", "Arial Narrow", sans-serif`;
  ctx.fillStyle = "#f6e2b0";
  ctx.textBaseline = "middle";
  ctx.fillText(String(year), 0, 0);
  ctx.restore();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function Banners({ fonts }: { fonts: boolean }) {
  const { invalidate } = useThree();
  const textures = useMemo(
    () => titles.map((t) => bannerTexture(t.year)),
    // Repainted once the typeface has loaded.
    [fonts],
  );
  useEffect(() => {
    invalidate();
    return () => textures.forEach((t) => t.dispose());
  }, [textures, invalidate]);
  const half = Math.ceil(titles.length / 2);
  return (
    <>
      {textures.map((tex, i) => {
        // Eight down each side wall, facing the centre like a nave.
        const left = i < half;
        const k = left ? i : i - half;
        return (
          <mesh
            key={i}
            position={[LEGACY_X + (left ? -12.6 : 12.6), 4.8, -5 + k * 1.35]}
            rotation={[0, left ? Math.PI / 2 : -Math.PI / 2, 0]}
          >
            <planeGeometry args={[1, 3]} />
            <meshStandardMaterial
              map={tex}
              transparent
              roughness={0.9}
              emissive="#3a0508"
              emissiveIntensity={0.4}
            />
          </mesh>
        );
      })}
    </>
  );
}

function Plinth({ index }: { index: number }) {
  const title = titles[index];
  const p = legacyPlinth(index);
  const selected = useLegacyStore((s) => s.selected === title.year);
  const select = useLegacyStore((s) => s.select);
  const [hover, setHover] = useState(false);
  const plate = useCanvasTexture(256, 96);
  const { invalidate } = useThree();
  useEffect(() => {
    const ctx = (plate.image as HTMLCanvasElement).getContext("2d")!;
    const paint = () => {
      ctx.fillStyle = "#1a1310";
      ctx.fillRect(0, 0, 256, 96);
      ctx.strokeStyle = "#b8924c";
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 248, 88);
      ctx.fillStyle = "#e7c98c";
      ctx.textAlign = "center";
      ctx.font = `600 64px "Barlow Condensed", "Arial Narrow", sans-serif`;
      ctx.fillText(String(title.year), 128, 70);
      plate.needsUpdate = true;
      invalidate();
    };
    paint();
    loadBoardFonts().then(paint);
  }, [plate, title.year, invalidate]);
  const style = trophyStyleFor(title.year, "constructors");
  const lit = selected || hover;
  return (
    <group
      position={[p.x, p.y, p.z]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.delta > 6) return;
        select(selected ? null : title.year);
      }}
    >
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 1, 0.9]} />
        <meshStandardMaterial
          color={lit ? "#241a14" : "#161214"}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      <mesh position={[0, 1.005, 0]}>
        <boxGeometry args={[0.92, 0.012, 0.92]} />
        <meshStandardMaterial color="#b8924c" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.72, 0.452]}>
        <planeGeometry args={[0.62, 0.23]} />
        <meshBasicMaterial map={plate} toneMapped={false} />
      </mesh>
      <group position={[0, 1.01, 0]} scale={1.15}>
        <Trophy style={style} year={title.year} />
      </group>
      {lit && (
        <pointLight
          position={[0, 2.4, 0.9]}
          intensity={selected ? 9 : 5}
          distance={4}
          color="#ffe0a8"
        />
      )}
    </group>
  );
}

// The Legacy room: every constructors' title, under a gilded "16".
export default function LegacyRoom({ active }: { active: boolean }) {
  const { invalidate } = useThree();
  const wall = useCanvasTexture(2048, 1024);
  const [fonts, setFonts] = useState(false);
  useEffect(() => {
    let live = true;
    const paint = () => {
      if (!live) return;
      drawWall((wall.image as HTMLCanvasElement).getContext("2d")!, shield);
      wall.needsUpdate = true;
      invalidate();
    };
    let shield: HTMLImageElement | null = null;
    paint();
    Promise.all([
      loadBoardFonts(),
      teamShieldSrc ? loadImage(teamShieldSrc) : null,
    ]).then(([, img]) => {
      shield = img;
      paint();
      if (live) setFonts(true);
    });
    return () => {
      live = false;
    };
  }, [wall, invalidate]);
  useEffect(() => () => void (document.body.style.cursor = ""), []);
  const lacquer = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#2a0709",
        roughness: 0.28,
        metalness: 0.35,
      }),
    [],
  );
  useEffect(() => () => lacquer.dispose(), [lacquer]);

  const x = LEGACY_X;
  return (
    <group>
      {/* Deep red lacquered room with a gilded back wall. */}
      <mesh position={[x, 4, -6.6]}>
        <boxGeometry args={[26, 8, 0.3]} />
        <meshStandardMaterial color="#1c0406" roughness={0.5} />
      </mesh>
      <mesh position={[x, 4.6, -6.44]}>
        <planeGeometry args={[12, 6]} />
        <meshBasicMaterial map={wall} toneMapped={false} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[x + side * 13, 4, 0]} material={lacquer}>
          <boxGeometry args={[0.3, 8, 13.5]} />
        </mesh>
      ))}
      <mesh
        position={[x, -0.09, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={lacquer}
        receiveShadow
      >
        <planeGeometry args={[26, 14]} />
      </mesh>
      {/* Gold inlay rings on the floor and a raised back tier. */}
      {[3.2, 3.28, 5.6].map((r) => (
        <mesh
          key={r}
          position={[x, 0.002, 2.4]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[r, r + 0.03, 128]} />
          <meshBasicMaterial color="#b8924c" />
        </mesh>
      ))}
      <mesh position={[x, 0.35, -3.4]} receiveShadow>
        <boxGeometry args={[15, 0.7, 1.6]} />
        <meshStandardMaterial
          color="#180c0c"
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>
      <mesh position={[x, 0.705, -2.6]}>
        <boxGeometry args={[15, 0.012, 0.03]} />
        <meshBasicMaterial color="#b8924c" />
      </mesh>
      <mesh position={[x - 13, 0.012, 1.5]}>
        <boxGeometry args={[0.04, 0.012, 11]} />
        <meshBasicMaterial color="#d3323a" />
      </mesh>
      {active && (
        <>
          <Banners fonts={fonts} />
          {titles.map((t, i) => (
            <Plinth key={t.year} index={i} />
          ))}
        </>
      )}
      <pointLight
        position={[x, 6.5, 4]}
        intensity={active ? 34 : 0}
        color="#ffdca0"
        distance={22}
      />
      <pointLight
        position={[x - 8, 2.5, 1]}
        intensity={active ? 16 : 0}
        color="#e3202b"
        distance={12}
      />
      <pointLight
        position={[x + 8, 2.5, 1]}
        intensity={active ? 16 : 0}
        color="#e3202b"
        distance={12}
      />
      <pointLight
        position={[x, 3, -5.5]}
        intensity={active ? 12 : 0}
        color="#ffc670"
        distance={8}
      />
    </group>
  );
}
