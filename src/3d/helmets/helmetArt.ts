// Helmet livery painter. Designs are described in a small vocabulary (see
// src/data/helmetDesigns.json) and painted onto the shell's texture.
//
// Design coordinates: u runs around the helmet (0 = front/visor, 0.25 = the
// driver's left, 0.5 = back, 0.75 = right); v runs from 0 at the crown to 1 at
// the lower edge.

export type HelmetLayer =
  | { shape: "band"; v0: number; v1: number; color: string; slope?: number }
  | { shape: "crown"; v1: number; color: string }
  | {
      shape: "stripe";
      u: number;
      width: number;
      v0: number;
      v1: number;
      color: string;
    }
  | {
      shape: "chevron";
      v: number;
      depth: number;
      thickness: number;
      color: string;
    }
  | { shape: "star"; u: number; v: number; size: number; color: string }
  | { shape: "circle"; u: number; v: number; size: number; color: string }
  | {
      shape: "flag";
      u: number;
      v: number;
      width: number;
      height: number;
      colors: string[];
      orientation: "horizontal" | "vertical";
    }
  | {
      shape: "text";
      u: number;
      v: number;
      size: number;
      text: string;
      color: string;
    };

export interface HelmetDesign {
  year?: number;
  helmetType: "cloth-cap" | "open-face" | "full-face";
  description?: string;
  base: string;
  visorSurround: string;
  visorTint:
    | "clear"
    | "dark"
    | "iridium-blue"
    | "iridium-gold"
    | "iridium-red"
    | "goggles";
  /** Colour of a front peak (brim), for open-face helmets of the 1950s. */
  peak?: string;
  layers: HelmetLayer[];
  sources?: string[];
  confidence?: "high" | "medium" | "low";
}

export const HELMET_TEX_W = 1024;
export const HELMET_TEX_H = 512;
/** Fraction of the sphere (from the crown) covered by a full-face shell. */
export const SHELL_THETA = 0.8;
/** Open-face shells stop around the temples. */
export const OPEN_THETA = 0.56;

// Texture u starts at the back of the shell so the seam is hidden.
const tu = (u: number) => (((u + 0.5) % 1) + 1) % 1;
// The shell's texture spans exactly the painted range, so v maps straight on.
const tv = (v: number) => v;

export function paintHelmet(
  ctx: CanvasRenderingContext2D,
  design: HelmetDesign,
) {
  const W = HELMET_TEX_W;
  const H = HELMET_TEX_H;
  const theta = design.helmetType === "full-face" ? SHELL_THETA : OPEN_THETA;
  ctx.fillStyle = design.base;
  ctx.fillRect(0, 0, W, H);

  // Shapes placed at (u, v) are squeezed towards the crown by the sphere
  // mapping; widen them by 1/sin(theta) so they read at their intended size.
  const stretch = (v: number) =>
    1 / Math.max(0.35, Math.sin(v * theta * Math.PI));
  const around = (u: number, draw: (x: number) => void) => {
    const x = tu(u) * W;
    draw(x);
    // Repeat across the seam.
    if (x < W * 0.2) draw(x + W);
    if (x > W * 0.8) draw(x - W);
  };

  for (const l of design.layers) {
    ctx.save();
    switch (l.shape) {
      case "crown":
        ctx.fillStyle = l.color;
        ctx.fillRect(0, 0, W, tv(l.v1) * H);
        break;
      case "band":
        ctx.fillStyle = l.color;
        if (l.slope) {
          ctx.beginPath();
          for (let i = 0; i <= 128; i++) {
            const u = i / 128;
            const y = (l.v0 + l.slope * Math.cos(u * Math.PI * 2)) * H;
            if (i === 0) ctx.moveTo(u * W, y);
            else ctx.lineTo(u * W, y);
          }
          for (let i = 128; i >= 0; i--) {
            const u = i / 128;
            ctx.lineTo(u * W, (l.v1 + l.slope * Math.cos(u * Math.PI * 2)) * H);
          }
          ctx.closePath();
          ctx.fill();
        } else ctx.fillRect(0, tv(l.v0) * H, W, (tv(l.v1) - tv(l.v0)) * H);
        break;
      case "stripe":
        ctx.fillStyle = l.color;
        around(l.u, (x) =>
          ctx.fillRect(
            x - (l.width * W) / 2,
            tv(l.v0) * H,
            l.width * W,
            (tv(l.v1) - tv(l.v0)) * H,
          ),
        );
        break;
      case "chevron": {
        ctx.strokeStyle = l.color;
        ctx.lineWidth = tv(l.thickness) * H;
        ctx.lineJoin = "miter";
        ctx.beginPath();
        // From the driver's right, down to a point at the front, up to the left.
        ctx.moveTo(tu(0.75) * W, tv(l.v) * H);
        ctx.lineTo(tu(0) * W, tv(l.v + l.depth) * H);
        ctx.lineTo(tu(0.25) * W, tv(l.v) * H);
        ctx.stroke();
        break;
      }
      case "star":
      case "circle": {
        const r = tv(l.size) * H * 0.5;
        const sx = stretch(l.v);
        ctx.fillStyle = l.color;
        around(l.u, (x) => {
          ctx.save();
          ctx.translate(x, tv(l.v) * H);
          ctx.scale(sx, 1);
          ctx.beginPath();
          if (l.shape === "circle") ctx.arc(0, 0, r, 0, Math.PI * 2);
          else
            for (let i = 0; i < 10; i++) {
              const a = -Math.PI / 2 + (i * Math.PI) / 5;
              const rr = i % 2 ? r * 0.42 : r;
              ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
          ctx.fill();
          ctx.restore();
        });
        break;
      }
      case "flag": {
        const w = l.width * W;
        const h = tv(l.height) * H;
        around(l.u, (x) => {
          const x0 = x - w / 2;
          const y0 = tv(l.v) * H - h / 2;
          l.colors.forEach((c, i) => {
            ctx.fillStyle = c;
            if (l.orientation === "vertical")
              ctx.fillRect(
                x0 + (i * w) / l.colors.length,
                y0,
                Math.ceil(w / l.colors.length),
                h,
              );
            else
              ctx.fillRect(
                x0,
                y0 + (i * h) / l.colors.length,
                w,
                Math.ceil(h / l.colors.length),
              );
          });
        });
        break;
      }
      case "text": {
        ctx.fillStyle = l.color;
        ctx.font = `700 ${tv(l.size) * H}px "Barlow Condensed", Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        around(l.u, (x) => {
          ctx.save();
          ctx.translate(x, tv(l.v) * H);
          ctx.scale(stretch(l.v), 1);
          ctx.fillText(l.text, 0, 0);
          ctx.restore();
        });
        break;
      }
    }
    ctx.restore();
  }

  // Eye port and its rubber surround (the visor mesh sits over this).
  if (design.helmetType === "full-face") {
    ctx.fillStyle = design.visorSurround;
    const x = tu(0) * W;
    ctx.fillRect(x - W * 0.15, tv(0.4) * H, W * 0.3, (tv(0.6) - tv(0.4)) * H);
  }
}
