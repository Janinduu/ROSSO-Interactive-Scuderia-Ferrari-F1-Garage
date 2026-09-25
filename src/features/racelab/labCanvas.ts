import { COL, atDistance, atTime } from "./labData";
import type { LabDriver } from "./labData";

export const DRIVER_COLOURS = ["#ff2a2a", "#f1dfb4"];

function setup(canvas: HTMLCanvasElement) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

/** Track map from the car's own x/y positions, coloured by mini-sector winner. */
export function drawTrack(
  canvas: HTMLCanvasElement,
  drivers: LabDriver[],
  sectors: { d0: number; d1: number; faster: number }[],
  cursorMs: number,
) {
  const { ctx, w, h } = setup(canvas);
  const ref = drivers[0];
  const xs = ref.samples.map((s) => s[COL.x]);
  const ys = ref.samples.map((s) => s[COL.y]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const pad = 30;
  const scale = Math.min((w - pad * 2) / (x1 - x0 || 1), (h - pad * 2) / (y1 - y0 || 1));
  const ox = (w - (x1 - x0) * scale) / 2;
  const oy = (h - (y1 - y0) * scale) / 2;
  // OpenF1 y grows upwards; the screen's grows downwards.
  const P = (x: number, y: number) => [ox + (x - x0) * scale, h - (oy + (y - y0) * scale)] as const;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ref.samples.forEach((s, i) => {
    const [x, y] = P(s[COL.x], s[COL.y]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#2a2c31";
  ctx.lineWidth = 14;
  ctx.stroke();
  // Mini-sectors in the colour of whoever was faster there.
  for (const sec of sectors) {
    ctx.beginPath();
    for (let d = sec.d0; d <= sec.d1; d += 8) {
      const s = atDistance(ref, d);
      const [x, y] = P(s[COL.x], s[COL.y]);
      if (d === sec.d0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = DRIVER_COLOURS[sec.faster];
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Start/finish.
  const [sx, sy] = P(ref.samples[0][COL.x], ref.samples[0][COL.y]);
  ctx.fillStyle = "#f4f2ec";
  ctx.fillRect(sx - 7, sy - 2, 14, 4);
  // Ghost cars at the same moment of their laps.
  drivers.forEach((d, i) => {
    const s = atTime(d, cursorMs);
    const [x, y] = P(s[COL.x], s[COL.y]);
    ctx.save();
    ctx.shadowColor = DRIVER_COLOURS[i];
    ctx.shadowBlur = 14;
    ctx.fillStyle = DRIVER_COLOURS[i];
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#050506";
    ctx.font = `700 9px "Barlow Condensed", Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(d.number), x, y + 0.5);
  });
}

export interface Channel {
  key: "speed" | "throttle" | "brake" | "gear" | "delta";
  label: string;
  unit: string;
  min: number;
  max: number;
  height: number;
}

/** Stacked telemetry traces against distance, with a cursor. */
export function drawTraces(
  canvas: HTMLCanvasElement,
  drivers: LabDriver[],
  channels: Channel[],
  delta: [number, number][],
  cursorD: number,
) {
  const { ctx, w, h } = setup(canvas);
  const left = 64;
  const right = 14;
  const len = Math.min(...drivers.map((d) => d.length));
  const X = (d: number) => left + (d / len) * (w - left - right);
  const total = channels.reduce((a, c) => a + c.height, 0);
  let top = 6;
  for (const ch of channels) {
    const hh = ((h - 12) * ch.height) / total;
    const Y = (v: number) => top + hh - 6 - ((v - ch.min) / (ch.max - ch.min)) * (hh - 16);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, top + hh - 0.5);
    ctx.lineTo(w - right, top + hh - 0.5);
    ctx.stroke();
    ctx.fillStyle = "#8d9296";
    ctx.font = `500 11px "Barlow", Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(ch.label.toUpperCase(), 6, top + 4);
    ctx.fillStyle = "#5f6468";
    ctx.fillText(ch.unit, 6, top + 18);
    if (ch.key === "delta") {
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.moveTo(left, Y(0));
      ctx.lineTo(w - right, Y(0));
      ctx.stroke();
      ctx.beginPath();
      delta.forEach(([d, v], i) => {
        const y = Y(Math.max(ch.min, Math.min(ch.max, v)));
        if (i === 0) ctx.moveTo(X(d), y);
        else ctx.lineTo(X(d), y);
      });
      ctx.strokeStyle = "#e7c9a2";
      ctx.lineWidth = 1.8;
      ctx.stroke();
    } else {
      const col = { speed: COL.speed, throttle: COL.throttle, brake: COL.brake, gear: COL.gear }[ch.key];
      drivers.forEach((drv, i) => {
        ctx.beginPath();
        drv.samples.forEach((s, j) => {
          if (s[0] > len) return;
          const y = Y(s[col]);
          if (j === 0) ctx.moveTo(X(s[0]), y);
          else ctx.lineTo(X(s[0]), y);
        });
        ctx.strokeStyle = DRIVER_COLOURS[i];
        ctx.globalAlpha = i === 0 ? 0.95 : 0.8;
        ctx.lineWidth = ch.key === "speed" ? 1.8 : 1.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    }
    top += hh;
  }
  // Cursor.
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X(cursorD), 4);
  ctx.lineTo(X(cursorD), h - 4);
  ctx.stroke();
  return { left, right, len };
}
