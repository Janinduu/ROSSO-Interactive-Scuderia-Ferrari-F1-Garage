import { CanvasTexture, SRGBColorSpace } from "three";

export interface CarpetDesign {
  /** Floor size in metres: width along x, depth along z. */
  width: number;
  depth: number;
  base: string;
  /** Runner colour; the runner leads from the entrance to `focus`. */
  runner: string;
  runnerWidth: number;
  /** Where the runner ends, relative to the carpet centre (metres). */
  focus: { x: number; z: number };
  /** Radius of the medallion the runner opens into. */
  focusRadius: number;
  line: string;
}

// A clean, modern museum carpet painted on a canvas: fine fibre grain, a soft
// vignette, a double hairline border and a runner from the entrance to the
// room's centre piece. The canvas top is the back wall; its bottom the entrance.
export function carpetTexture(d: CarpetDesign) {
  const ppm = 80;
  const W = Math.round(d.width * ppm);
  const H = Math.round(d.depth * ppm);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const px = (m: number) => m * ppm;
  const fx = W / 2 + px(d.focus.x);
  const fy = H / 2 + px(d.focus.z);
  const rw = px(d.runnerWidth);

  ctx.fillStyle = d.base;
  ctx.fillRect(0, 0, W, H);
  // The runner, opening into a medallion around the centre piece.
  ctx.fillStyle = d.runner;
  ctx.fillRect(fx - rw / 2, fy, rw, H - fy);
  ctx.beginPath();
  ctx.arc(fx, fy, px(d.focusRadius), 0, Math.PI * 2);
  ctx.fill();

  // Fibre grain: many faint specks, lighter and darker than the pile.
  const img = ctx.getImageData(0, 0, W, H);
  const p = img.data;
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < p.length; i += 4) {
    const n = (rand() - 0.5) * 22;
    p[i] = Math.max(0, Math.min(255, p[i] + n));
    p[i + 1] = Math.max(0, Math.min(255, p[i + 1] + n));
    p[i + 2] = Math.max(0, Math.min(255, p[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  // Hairlines: a double border, the runner's edges and the medallion ring.
  ctx.strokeStyle = d.line;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 3;
  for (const inset of [px(0.45), px(0.58)]) ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  const gap = Math.asin(Math.min(1, rw / 2 / px(d.focusRadius)));
  const edgeY = fy + Math.cos(gap) * px(d.focusRadius);
  ctx.beginPath();
  ctx.moveTo(fx - rw / 2, edgeY);
  ctx.lineTo(fx - rw / 2, H - px(0.58));
  ctx.moveTo(fx + rw / 2, edgeY);
  ctx.lineTo(fx + rw / 2, H - px(0.58));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(fx, fy, px(d.focusRadius), Math.PI / 2 + gap, Math.PI / 2 - gap + Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // A soft vignette keeps the eye on the centre of the room.
  const v = ctx.createRadialGradient(fx, fy, px(1), W / 2, H / 2, Math.max(W, H) * 0.62);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);

  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
