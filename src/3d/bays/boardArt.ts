import type { Driver } from "../../data/drivers";
import { drawFlag } from "./flags";
import { careerTitles } from "../../data/careerStats";

// 2D artwork for the bay boards and chapter markers, painted into canvas
// textures. Kept separate from React so the layout can be tuned in one place.
export const BOARD_W = 1024;
export const BOARD_H = 512;
export const CHAPTER_W = 256;
export const CHAPTER_H = 1024;

const HEADING = '"Barlow Condensed", "Arial Narrow", Arial, sans-serif';
const BODY = '"Barlow", Arial, sans-serif';

export type BayState = "idle" | "hover" | "selected";

let fontsReady: Promise<unknown> | null = null;
export function loadBoardFonts() {
  fontsReady ??= Promise.all([
    document.fonts.load(`400 48px "Barlow Condensed"`),
    document.fonts.load(`600 96px "Barlow Condensed"`),
    document.fonts.load(`500 24px "Barlow"`),
  ]).catch(() => undefined);
  return fontsReady;
}

const images = new Map<string, Promise<HTMLImageElement | null>>();
export function loadImage(src: string) {
  if (!images.has(src))
    images.set(
      src,
      new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      }),
    );
  return images.get(src)!;
}

const tracking = (ctx: CanvasRenderingContext2D, px: number) => {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
};

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawPortrait(
  ctx: CanvasRenderingContext2D,
  driver: Driver,
  portrait: HTMLImageElement | null,
  focal: [number, number],
  zoom: number,
  state: BayState,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = "#1b1d21";
  ctx.fillRect(x, y, w, h);
  if (portrait) {
    // Cover-crop around the face, keeping it in the upper third of the frame.
    const scale = Math.max(w / portrait.width, h / portrait.height) * zoom;
    const sw = w / scale;
    const sh = h / scale;
    const sx = Math.min(
      Math.max(focal[0] * portrait.width - sw / 2, 0),
      portrait.width - sw,
    );
    const sy = Math.min(
      Math.max(focal[1] * portrait.height - sh * 0.36, 0),
      portrait.height - sh,
    );
    // Archival monochrome in the corridor; warm colour once the bay is entered.
    ctx.filter =
      state === "selected"
        ? "contrast(1.1) saturate(1.08) brightness(0.98)"
        : state === "hover"
          ? "grayscale(0.7) contrast(1.12) brightness(0.9)"
          : "grayscale(1) contrast(1.15) brightness(0.78)";
    ctx.drawImage(portrait, sx, sy, sw, sh, x, y, w, h);
    ctx.filter = "none";
  } else {
    const initials = driver.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 3);
    ctx.fillStyle = "#ffffff12";
    ctx.font = `600 150px ${HEADING}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, x + w / 2, y + h * 0.45);
  }
  // Cinematic grade: vignette, floor fade and a warm key-light edge.
  const vignette = ctx.createRadialGradient(
    x + w / 2,
    y + h * 0.38,
    h * 0.22,
    x + w / 2,
    y + h * 0.45,
    h * 0.85,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.62)");
  ctx.fillStyle = vignette;
  ctx.fillRect(x, y, w, h);
  const fade = ctx.createLinearGradient(0, y + h * 0.55, 0, y + h);
  fade.addColorStop(0, "rgba(12,12,13,0)");
  fade.addColorStop(1, "rgba(12,12,13,0.88)");
  ctx.fillStyle = fade;
  ctx.fillRect(x, y, w, h);
  if (state === "selected") {
    const key = ctx.createLinearGradient(x + w, 0, x + w * 0.55, 0);
    key.addColorStop(0, "rgba(214,40,48,0.28)");
    key.addColorStop(1, "rgba(214,40,48,0)");
    ctx.fillStyle = key;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
  ctx.fillStyle = state === "selected" ? "#d3323a" : "#5b2227";
  ctx.fillRect(x + w - 3, y, 3, h);
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  {
    driver,
    chapter,
    portrait,
    focal,
    zoom = 1,
    state,
  }: {
    driver: Driver;
    chapter: number;
    portrait: HTMLImageElement | null;
    focal: [number, number];
    zoom?: number;
    state: BayState;
  },
) {
  const W = BOARD_W;
  const H = BOARD_H;
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1d1f23");
  bg.addColorStop(1, "#111214");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#ffffff16";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);
  ctx.fillStyle = state === "selected" ? "#d3323a" : "#4a1c20";
  ctx.fillRect(0, 0, W, 5);

  drawPortrait(ctx, driver, portrait, focal, zoom, state, 28, 30, 272, 452);

  const x0 = 336;
  const right = W - 36;
  const width = right - x0;
  ctx.textBaseline = "alphabetic";

  // Decorative bay number behind the type.
  ctx.textAlign = "right";
  ctx.font = `600 230px ${HEADING}`;
  tracking(ctx, 0);
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  ctx.fillText(driver.number, W - 20, 330);

  ctx.textAlign = "left";
  ctx.fillStyle = "#d3323a";
  ctx.fillRect(x0, 52, 34, 3);
  ctx.font = `500 21px ${BODY}`;
  tracking(ctx, 3);
  ctx.fillStyle = "#a6abaf";
  ctx.fillText(
    `CHAPTER ${String(chapter).padStart(2, "0")} · ${driver.era.toUpperCase()}`,
    x0 + 48,
    61,
  );

  const parts = driver.name.split(" ");
  const last = parts.at(-1)!.toUpperCase();
  const first = parts.slice(0, -1).join(" ");
  tracking(ctx, 0);
  ctx.font = `400 50px ${HEADING}`;
  ctx.fillStyle = "#d5d0c8";
  ctx.fillText(first, x0 - 2, 118);
  let size = 104;
  do {
    ctx.font = `600 ${size}px ${HEADING}`;
    size -= 4;
  } while (ctx.measureText(last).width > width && size > 60);
  ctx.fillStyle = "#f4f0e9";
  ctx.fillText(last, x0 - 4, 222);

  const flagged = drawFlag(ctx, driver.flag, x0, 244, 33, 22);
  ctx.font = `500 22px ${BODY}`;
  tracking(ctx, 2.5);
  ctx.fillStyle = "#b5b9bc";
  ctx.fillText(
    `${driver.nationality.toUpperCase()}  ·  FERRARI ${driver.ferrariYears}`,
    x0 + (flagged ? 46 : 0),
    262,
  );
  ctx.fillStyle = "#ffffff1c";
  ctx.fillRect(x0, 290, width, 1);

  tracking(ctx, 0);
  ctx.font = `400 38px ${HEADING}`;
  ctx.fillStyle = "#e2ded6";
  wrap(ctx, driver.tagline, width)
    .slice(0, 2)
    .forEach((line, i) => ctx.fillText(line, x0, 338 + i * 42));

  const titles = careerTitles(driver.id);
  if (titles.length) {
    // Ferrari titles in gold, titles won with other teams in silver.
    let size = 19;
    const label = "WORLD CHAMPION  ";
    const years = titles.map((t, i) => `${t.year}${i < titles.length - 1 ? " · " : ""}`);
    tracking(ctx, 2.5);
    do {
      ctx.font = `500 ${size}px ${BODY}`;
      size -= 1;
    } while (ctx.measureText(label + years.join("")).width > width && size > 13);
    let cx = x0;
    ctx.fillStyle = "#a9adb0";
    ctx.fillText(label, cx, 436);
    cx += ctx.measureText(label).width;
    titles.forEach((t, i) => {
      ctx.fillStyle = t.team === "Ferrari" ? "#d6b46e" : "#8f9498";
      ctx.fillText(years[i], cx, 436);
      cx += ctx.measureText(years[i]).width;
    });
  }

  ctx.textAlign = "right";
  ctx.font = `600 19px ${BODY}`;
  tracking(ctx, 2.5);
  if (state === "selected") {
    ctx.fillStyle = "#e0454c";
    ctx.fillText("NOW VIEWING", right, 482);
  } else {
    ctx.fillStyle = state === "hover" ? "#f1ede6" : "#81878b";
    ctx.fillText("ENTER BAY  →", right, 482);
  }
  tracking(ctx, 0);
}

export function drawChapter(
  ctx: CanvasRenderingContext2D,
  chapter: number,
  title: string,
) {
  const W = CHAPTER_W;
  const H = CHAPTER_H;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#15171a";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#d3323a";
  ctx.fillRect(0, 0, W, 6);
  ctx.textAlign = "center";
  ctx.fillStyle = "#8f9498";
  ctx.font = `500 26px ${BODY}`;
  tracking(ctx, 5);
  ctx.fillText("CHAPTER", W / 2, 70);
  tracking(ctx, 0);
  ctx.fillStyle = "#f1ede6";
  ctx.font = `500 120px ${HEADING}`;
  ctx.fillText(String(chapter).padStart(2, "0"), W / 2, 196);
  ctx.save();
  ctx.translate(W / 2 + 14, 250);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = "left";
  ctx.fillStyle = "#d5d0c8";
  ctx.font = `500 52px ${HEADING}`;
  tracking(ctx, 4);
  ctx.fillText(title.toUpperCase(), 0, 0);
  ctx.restore();
  tracking(ctx, 0);
}

export const SIGN_W = 1024;
export const SIGN_H = 256;

// The team wordmark as a backlit wall sign: a warm-white core with a red halo,
// painted once and shared by every bay.
export function drawWordmark(ctx: CanvasRenderingContext2D, mark: HTMLImageElement) {
  const W = SIGN_W;
  const H = SIGN_H;
  ctx.clearRect(0, 0, W, H);
  const aspect = mark.width / mark.height || 4.5;
  const mw = Math.min(W * 0.78, H * 0.62 * aspect);
  const mh = mw / aspect;
  const mx = (W - mw) / 2;
  const my = (H - mh) / 2;
  // Tint the mark on a scratch canvas.
  const tint = (color: string) => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const t = c.getContext("2d")!;
    t.drawImage(mark, mx, my, mw, mh);
    t.globalCompositeOperation = "source-in";
    t.fillStyle = color;
    t.fillRect(0, 0, W, H);
    return c;
  };
  ctx.save();
  ctx.filter = "blur(18px)";
  ctx.globalAlpha = 0.9;
  ctx.drawImage(tint("#e3202b"), 0, 0);
  ctx.filter = "blur(5px)";
  ctx.globalAlpha = 0.8;
  ctx.drawImage(tint("#ff4a3d"), 0, 0);
  ctx.restore();
  ctx.drawImage(tint("#fff4e8"), 0, 0);
}
