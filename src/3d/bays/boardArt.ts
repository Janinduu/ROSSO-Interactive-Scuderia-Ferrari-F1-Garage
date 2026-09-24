import type { Driver } from "../../data/drivers";

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
    const scale = Math.max(w / portrait.width, h / portrait.height);
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
    emblem,
    state,
  }: {
    driver: Driver;
    chapter: number;
    portrait: HTMLImageElement | null;
    focal: [number, number];
    emblem: HTMLImageElement | null;
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

  drawPortrait(ctx, driver, portrait, focal, state, 28, 30, 272, 452);

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

  if (emblem) {
    const box = 86;
    const s = Math.min(box / emblem.width, box / emblem.height);
    const ew = emblem.width * s;
    const eh = emblem.height * s;
    ctx.drawImage(emblem, right - ew, 30 + (box - eh) / 2, ew, eh);
  }

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
  ctx.fillText(first, x0 - 2, 128);
  let size = 112;
  do {
    ctx.font = `600 ${size}px ${HEADING}`;
    size -= 4;
  } while (ctx.measureText(last).width > width - (emblem ? 96 : 0) && size > 60);
  ctx.fillStyle = "#f4f0e9";
  ctx.fillText(last, x0 - 4, 216);

  ctx.font = `500 22px ${BODY}`;
  tracking(ctx, 2.5);
  ctx.fillStyle = "#b5b9bc";
  ctx.fillText(
    `${driver.nationality.toUpperCase()}  ·  FERRARI ${driver.ferrariYears}`,
    x0,
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

  if (driver.championshipsWithFerrari.length) {
    ctx.font = `500 19px ${BODY}`;
    tracking(ctx, 2.5);
    ctx.fillStyle = "#c4a86f";
    ctx.fillText(
      `WORLD CHAMPION  ${driver.championshipsWithFerrari.join(" · ")}`,
      x0,
      436,
    );
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
