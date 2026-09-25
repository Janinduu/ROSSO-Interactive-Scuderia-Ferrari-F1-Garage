import { Track } from "./moments";
import type { CarState } from "./moments";

// Canvas painter for the replay theatre. World coordinates are the track's
// 0..1 box; a camera blends an overview with a close follow of a Ferrari.

export interface View {
  cx: number;
  cy: number;
  zoom: number;
}

/** The whole circuit, centred on its bounding box. */
export function overview(track?: Track): View {
  if (!track) return { cx: 0.5, cy: 0.5, zoom: 1 };
  const b = track.box;
  return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, zoom: 1 };
}

/** Screen space the circuit may use, clear of the HUD, tower and controls. */
export interface Insets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function lerpView(a: View, b: View, k: number): View {
  return { cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k, zoom: a.zoom + (b.zoom - a.zoom) * k };
}

export function drawRace(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  track: Track,
  cars: CarState[],
  view: View,
  opts: { reveal: number; focusId: string | null; insets: Insets },
) {
  ctx.clearRect(0, 0, w, h);
  // Deep background with a red-tinged vignette and a faint grid.
  const bg = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.75);
  bg.addColorStop(0, "#15100f");
  bg.addColorStop(1, "#050506");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Fit the circuit's bounds into the free area at zoom 1.
  const { left, right, top, bottom } = opts.insets;
  const availW = Math.max(120, w - left - right);
  const availH = Math.max(120, h - top - bottom);
  const b = track.box;
  const base = Math.min(availW / (b.x1 - b.x0), availH / (b.y1 - b.y0)) * 0.92;
  const scale = base * view.zoom;
  const ox = left + availW / 2 - view.cx * scale;
  const oy = top + availH / 2 - view.cy * scale;
  const X = (x: number) => ox + x * scale;
  const Y = (y: number) => oy + y * scale;

  ctx.strokeStyle = "rgba(255,255,255,0.025)";
  ctx.lineWidth = 1;
  const gridStep = scale / 10;
  for (let gx = ((ox % gridStep) + gridStep) % gridStep; gx < w; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
    ctx.stroke();
  }
  for (let gy = ((oy % gridStep) + gridStep) % gridStep; gy < h; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }

  // The circuit: kerb edge, asphalt, and a faint glowing racing line. It draws
  // itself in during the opening seconds.
  const px = Math.max(1, Math.min(w, h) / 900);
  const path = new Path2D();
  const pts = track.points;
  const count = Math.max(2, Math.floor(pts.length * opts.reveal));
  path.moveTo(X(pts[0][0]), Y(pts[0][1]));
  for (let i = 1; i <= count; i++) {
    const p = pts[i % pts.length];
    path.lineTo(X(p[0]), Y(p[1]));
  }
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#3a3d43";
  ctx.lineWidth = 20 * px * Math.sqrt(view.zoom);
  ctx.stroke(path);
  ctx.strokeStyle = "#1c1e22";
  ctx.lineWidth = 16 * px * Math.sqrt(view.zoom);
  ctx.stroke(path);
  ctx.strokeStyle = "rgba(227,58,63,0.12)";
  ctx.lineWidth = 6 * px;
  ctx.stroke(path);
  ctx.strokeStyle = "rgba(227,58,63,0.45)";
  ctx.lineWidth = 1.4 * px;
  ctx.stroke(path);

  // Chequered start/finish line across the track.
  if (opts.reveal >= 1) {
    const s = track.at(0);
    const half = 9 * px * Math.sqrt(view.zoom);
    ctx.save();
    ctx.translate(X(s.x), Y(s.y));
    ctx.rotate(s.angle + Math.PI / 2);
    const cells = 6;
    const cw = (half * 2) / cells;
    for (let i = 0; i < cells; i++)
      for (let j = 0; j < 2; j++) {
        ctx.fillStyle = (i + j) % 2 ? "#f4f2ec" : "#111";
        ctx.fillRect(-half + i * cw, -cw + j * cw, cw, cw);
      }
    ctx.restore();
  }
  if (opts.reveal < 1) return;

  // Cars, back of the field first so the leaders sit on top.
  const r = 4.2 * px * Math.pow(view.zoom, 0.35);
  const order = [...cars].reverse();
  for (const car of order) {
    if (car.distance < -1) continue;
    const pos = track.at(car.distance);
    const x = X(pos.x);
    const y = Y(pos.y);
    const out = !car.running && !car.finished;
    const f = car.driver.ferrari;
    if (f && car.running) {
      // A light trail behind each Ferrari.
      const trail = 0.035;
      ctx.beginPath();
      for (let k = 0; k <= 12; k++) {
        const p = track.at(car.distance - (trail * k) / 12);
        if (k === 0) ctx.moveTo(X(p.x), Y(p.y));
        else ctx.lineTo(X(p.x), Y(p.y));
      }
      const tail = track.at(car.distance - trail);
      const grad = ctx.createLinearGradient(x, y, X(tail.x), Y(tail.y));
      grad.addColorStop(0, "rgba(255,60,50,0.85)");
      grad.addColorStop(1, "rgba(255,60,50,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = r * 1.4;
      ctx.stroke();
    }
    ctx.save();
    if (f) {
      ctx.shadowColor = "rgba(255,40,40,0.9)";
      ctx.shadowBlur = 16;
    }
    ctx.globalAlpha = out ? 0.25 : 1;
    ctx.fillStyle = f ? "#ff2a2a" : car === cars[0] && car.running ? "#f1e3bf" : "#b9bec5";
    ctx.beginPath();
    ctx.arc(x, y, f ? r * 1.35 : r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const labelled = f || cars.indexOf(car) < 3 || car.driver.id === opts.focusId;
    if (labelled && !out) {
      ctx.font = `600 ${Math.round(11 * px + 2)}px "Barlow Condensed", Arial, sans-serif`;
      ctx.fillStyle = f ? "#ffd9d4" : "#d9dde2";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(car.driver.code, x + r * 2, y - r * 1.6);
    }
  }
}
