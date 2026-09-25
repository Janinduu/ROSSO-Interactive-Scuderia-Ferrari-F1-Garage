import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Group } from "three";
import CarModel from "../cars/CarModel";
import { CAR_SCALE } from "../cars/anchors";
import { EVOLUTION_X } from "../camera/poses";
import { useCanvasTexture } from "../bays/BayBoard";
import { loadBoardFonts } from "../bays/boardArt";
import { helmetDesignFor } from "../../data/helmetDesigns";
import { drivers } from "../../data/drivers";
import type { Milestone } from "../../features/evolution/evolution";

const W = 2048;
const H = 768;

function drawWall(ctx: CanvasRenderingContext2D, year: number, m: Milestone) {
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#17181b");
  bg.addColorStop(1, "#0f1012");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#d3323a";
  ctx.fillRect(0, 0, W, 6);
  ctx.textAlign = "left";
  ctx.fillStyle = "#a6abaf";
  ctx.font = `500 40px "Barlow", Arial, sans-serif`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "10px";
  ctx.fillText("THE EVOLUTION  ·  1950 — 2026", 90, 110);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  // The year, huge and warm.
  ctx.font = `600 440px "Barlow Condensed", "Arial Narrow", sans-serif`;
  const glow = ctx.createLinearGradient(0, 180, 0, 620);
  glow.addColorStop(0, "#fff4e8");
  glow.addColorStop(1, "#e7c9a2");
  ctx.fillStyle = glow;
  ctx.shadowColor = "rgba(227,40,48,0.55)";
  ctx.shadowBlur = 60;
  ctx.fillText(String(year), 80, 590);
  ctx.shadowBlur = 0;
  ctx.textAlign = "right";
  ctx.fillStyle = "#f1ede6";
  ctx.font = `600 120px "Barlow Condensed", "Arial Narrow", sans-serif`;
  ctx.fillText(m.car.officialName ?? "", W - 90, 430);
  ctx.fillStyle = "#b5b9bc";
  ctx.font = `500 46px "Barlow", Arial, sans-serif`;
  ctx.fillText(`${m.driverName}  ·  ${m.year}`, W - 90, 510);
  ctx.fillStyle = "#8f9498";
  ctx.font = `500 36px "Barlow", Arial, sans-serif`;
  ctx.fillText(m.car.spec.familyLabel, W - 90, 575);
}

// The room before the first bay: a turntable under a backlit year wall.
export default function EvolutionRoom({
  year,
  milestone,
  active,
  reduced,
}: {
  year: number;
  milestone: Milestone;
  active: boolean;
  reduced: boolean;
}) {
  const { invalidate } = useThree();
  const wall = useCanvasTexture(W, H);
  const table = useRef<Group>(null);
  const carGroup = useRef<Group>(null);
  const swap = useRef(1);

  useEffect(() => {
    let live = true;
    const paint = () => {
      if (!live) return;
      drawWall((wall.image as HTMLCanvasElement).getContext("2d")!, year, milestone);
      wall.needsUpdate = true;
      invalidate();
    };
    paint();
    loadBoardFonts().then(paint);
    return () => {
      live = false;
    };
  }, [wall, year, milestone, invalidate]);

  // Each new car rises onto the turntable.
  useEffect(() => {
    swap.current = reduced ? 1 : 0;
    invalidate();
  }, [milestone, reduced, invalidate]);

  useFrame((_, dt) => {
    if (!active) return;
    if (table.current && !reduced) table.current.rotation.y += dt * 0.35;
    if (carGroup.current && swap.current < 1) {
      swap.current = Math.min(1, swap.current + dt * 3);
      const e = 1 - (1 - swap.current) ** 3;
      carGroup.current.scale.setScalar(CAR_SCALE * (0.82 + 0.18 * e));
      carGroup.current.position.y = 0.06 + (1 - e) * 0.35;
    }
    invalidate();
  });

  const driver = drivers.find((d) => d.id === milestone.driverId)!;
  const x = EVOLUTION_X;
  return (
    <group>
      {/* Back wall with the year display. */}
      <mesh position={[x, 2.5, -4.05]}>
        <boxGeometry args={[12, 5, 0.2]} />
        <meshStandardMaterial color="#17191c" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[x, 3.05, -3.93]}>
        <planeGeometry args={[9.6, 3.6]} />
        <meshBasicMaterial map={wall} toneMapped={false} />
      </mesh>
      {/* A lit threshold into the corridor. */}
      <mesh position={[x + 6.1, 2.5, -2]}>
        <boxGeometry args={[0.2, 5, 4]} />
        <meshStandardMaterial color="#202226" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[x + 6, 0.012, 1.5]}>
        <boxGeometry args={[0.04, 0.012, 11]} />
        <meshBasicMaterial color="#d3323a" />
      </mesh>
      {/* Turntable. */}
      <mesh position={[x, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[3.6, 3.7, 0.04, 96]} />
        <meshStandardMaterial color="#1c1d21" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[x, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.45, 3.52, 96]} />
        <meshBasicMaterial color="#d3323a" />
      </mesh>
      <group ref={table} position={[x, 0.045, 0]}>
        <mesh>
          <cylinderGeometry args={[3.3, 3.3, 0.02, 96]} />
          <meshStandardMaterial color="#2c2e33" metalness={0.45} roughness={0.5} />
        </mesh>
        <group ref={carGroup} position={[0, 0.06, 0]} scale={CAR_SCALE}>
          {active && (
            <CarModel
              key={milestone.car.id}
              spec={milestone.car.spec}
              livery={milestone.car.livery}
              number={milestone.car.raceNumber}
              helmet={helmetDesignFor(driver)}
            />
          )}
        </group>
      </group>
      <pointLight position={[x - 2.5, 5, 3]} intensity={active ? 30 : 0} color="#fff1df" distance={14} />
      <pointLight position={[x + 3, 2.2, -2.5]} intensity={active ? 14 : 0} color="#eb3039" distance={9} />
    </group>
  );
}
