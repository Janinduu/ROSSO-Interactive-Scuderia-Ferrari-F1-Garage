import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  DoubleSide,
  SRGBColorSpace,
} from "three";
import type { Group, Texture } from "three";
import { loadImage } from "../bays/boardArt";
import { beaconShieldSrc } from "../../data/media";

// The Ferrari shield floats and turns slowly above a lit plinth, the centre
// piece of the Hall of Champions and the Legacy room. The owner's local shield
// is used when present; the public build shows a credited Commons photograph.
// Its key light belongs to the room (always mounted, see HallRoom, LegacyRoom).
export default function ShieldBeacon({ x, z }: { x: number; z: number }) {
  const { invalidate } = useThree();
  const spin = useRef<Group>(null);
  const [shield, setShield] = useState<Texture | null>(null);
  useEffect(() => {
    let live = true;
    loadImage(beaconShieldSrc).then((img) => {
      if (!img || !live) return;
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d")!.drawImage(img, 0, 0);
      const t = new CanvasTexture(c);
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 4;
      setShield(t);
    });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => () => shield?.dispose(), [shield]);
  // A soft golden pool of light on the floor.
  const pool = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
    g.addColorStop(0, "rgba(255,210,130,0.75)");
    g.addColorStop(0.4, "rgba(255,190,100,0.22)");
    g.addColorStop(1, "rgba(255,190,100,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => pool.dispose(), [pool]);
  const reduced = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  useFrame(({ clock }) => {
    const g = spin.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    if (!reduced) {
      g.rotation.y = t * 0.6;
      g.position.y = 1.05 + Math.sin(t * 1.1) * 0.07;
    }
    invalidate();
  });
  const aspect = shield
    ? (shield.image as HTMLCanvasElement).width /
      (shield.image as HTMLCanvasElement).height
    : 0.75;
  const h = 0.95;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.6, 3.6]} />
        <meshBasicMaterial
          map={pool}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.95, 1.05, 0.1, 64]} />
        <meshStandardMaterial color="#141214" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.101, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.86, 0.92, 96]} />
        <meshBasicMaterial color="#d9b86e" toneMapped={false} />
      </mesh>
      {/* A faint column of light rising from the plinth. */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.5, 0.85, 2.1, 48, 1, true]} />
        <meshBasicMaterial
          color="#ffcf8a"
          transparent
          opacity={0.07}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {shield && (
        <group ref={spin} position={[0, 1.05, 0]}>
          <mesh>
            <planeGeometry args={[h * aspect, h]} />
            <meshBasicMaterial
              map={shield}
              transparent
              alphaTest={0.05}
              side={DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
