import { useMemo, useEffect } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

/** Sidewall markings sit on the shoulder, leaving the open rim visible. */
export function TyreLettering({
  radius,
  width,
  side,
  year,
}: {
  radius: number;
  width: number;
  side: number;
  year: number;
}) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d")!;
    const brand =
      year >= 2011
        ? "PIRELLI"
        : year >= 1999
          ? "BRIDGESTONE"
          : year >= 1978 && year <= 1981
            ? "MICHELIN"
            : "GOODYEAR";
    ctx.fillStyle = year >= 2011 ? "#ddc95c" : "#dedbd0";
    ctx.font = "bold 27px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const base of [-Math.PI / 2, Math.PI / 2])
      [...brand].forEach((ch, i) => {
        const a = base + (i - (brand.length - 1) / 2) * 0.12;
        ctx.save();
        ctx.translate(256 + Math.cos(a) * 215, 256 + Math.sin(a) * 215);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [year]);
  useEffect(() => () => texture.dispose(), [texture]);
  if (year < 1968) return null;
  return (
    <mesh
      position={[0, 0, side * (width / 2 + 0.002)]}
      rotation={[0, side > 0 ? 0 : Math.PI, 0]}
    >
      <planeGeometry args={[radius * 2, radius * 2]} />
      <meshStandardMaterial
        map={texture}
        transparent
        depthWrite={false}
        roughness={0.9}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
}
