// Simplified national flags painted onto the bay boards (3:2 unless noted).
type Ctx = CanvasRenderingContext2D;

const bands = (
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  colors: string[],
  vertical: boolean,
  weights = colors.map(() => 1),
) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let offset = 0;
  colors.forEach((c, i) => {
    const size = ((vertical ? w : h) * weights[i]) / total;
    ctx.fillStyle = c;
    if (vertical) ctx.fillRect(x + offset, y, Math.ceil(size), h);
    else ctx.fillRect(x, y + offset, w, Math.ceil(size));
    offset += size;
  });
};

const painters: Record<string, (ctx: Ctx, x: number, y: number, w: number, h: number) => void> = {
  IT: (c, x, y, w, h) => bands(c, x, y, w, h, ["#009246", "#f4f4f0", "#ce2b37"], true),
  FR: (c, x, y, w, h) => bands(c, x, y, w, h, ["#0055a4", "#f4f4f0", "#ef4135"], true),
  DE: (c, x, y, w, h) => bands(c, x, y, w, h, ["#111111", "#dd0000", "#ffce00"], false),
  AT: (c, x, y, w, h) => bands(c, x, y, w, h, ["#c8102e", "#f4f4f0", "#c8102e"], false),
  ES: (c, x, y, w, h) =>
    bands(c, x, y, w, h, ["#c60b1e", "#ffc400", "#c60b1e"], false, [1, 2, 1]),
  MC: (c, x, y, w, h) => bands(c, x, y, w, h, ["#ce1126", "#f4f4f0"], false),
  AR: (c, x, y, w, h) => {
    bands(c, x, y, w, h, ["#74acdf", "#f4f4f0", "#74acdf"], false);
    c.fillStyle = "#f6b40e";
    c.beginPath();
    c.arc(x + w / 2, y + h / 2, h * 0.12, 0, Math.PI * 2);
    c.fill();
  },
  CA: (c, x, y, w, h) => {
    bands(c, x, y, w, h, ["#d52b1e", "#f4f4f0", "#d52b1e"], true, [1, 2, 1]);
    // Maple leaf, simplified to a pointed star.
    c.fillStyle = "#d52b1e";
    c.beginPath();
    const cx = x + w / 2;
    const cy = y + h / 2;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? h * 0.13 : h * 0.3;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    c.fill();
  },
  FI: (c, x, y, w, h) => {
    c.fillStyle = "#f4f4f0";
    c.fillRect(x, y, w, h);
    c.fillStyle = "#002f6c";
    c.fillRect(x, y + h * 0.36, w, h * 0.28);
    c.fillRect(x + w * 0.28, y, h * 0.28, h);
  },
  GB: (c, x, y, w, h) => {
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    c.fillStyle = "#012169";
    c.fillRect(x, y, w, h);
    c.lineCap = "butt";
    const diag = (color: string, width: number) => {
      c.strokeStyle = color;
      c.lineWidth = width;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + w, y + h);
      c.moveTo(x + w, y);
      c.lineTo(x, y + h);
      c.stroke();
    };
    diag("#f4f4f0", h * 0.2);
    diag("#c8102e", h * 0.07);
    c.fillStyle = "#f4f4f0";
    c.fillRect(x, y + h * 0.33, w, h * 0.34);
    c.fillRect(x + w / 2 - h * 0.17, y, h * 0.34, h);
    c.fillStyle = "#c8102e";
    c.fillRect(x, y + h * 0.4, w, h * 0.2);
    c.fillRect(x + w / 2 - h * 0.1, y, h * 0.2, h);
    c.restore();
  },
  US: (c, x, y, w, h) => {
    for (let i = 0; i < 13; i++) {
      c.fillStyle = i % 2 ? "#f4f4f0" : "#b22234";
      c.fillRect(x, y + (i * h) / 13, w, Math.ceil(h / 13));
    }
    c.fillStyle = "#3c3b6e";
    c.fillRect(x, y, w * 0.4, h * (7 / 13));
    c.fillStyle = "#f4f4f0";
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 5; k++) {
        c.beginPath();
        c.arc(x + w * (0.05 + k * 0.075), y + h * (0.07 + r * 0.12), h * 0.025, 0, Math.PI * 2);
        c.fill();
      }
  },
  ZA: (c, x, y, w, h) => {
    bands(c, x, y, w, h, ["#de3831", "#002395"], false);
    const path = (pts: [number, number][], color: string) => {
      c.fillStyle = color;
      c.beginPath();
      pts.forEach(([px, py]) => c.lineTo(x + px * w, y + py * h));
      c.fill();
    };
    // White-bordered green "Y" and the black hoist triangle with a gold edge.
    path([[0, 0], [0.2, 0], [0.5, 0.35], [1, 0.35], [1, 0.65], [0.5, 0.65], [0.2, 1], [0, 1]], "#f4f4f0");
    path([[0, 0.08], [0.1, 0], [0.45, 0.4], [1, 0.4], [1, 0.6], [0.45, 0.6], [0.1, 1], [0, 0.92]], "#007a4d");
    path([[0, 0.2], [0.3, 0.5], [0, 0.8]], "#ffb612");
    path([[0, 0.28], [0.22, 0.5], [0, 0.72]], "#111111");
  },
};

export function drawFlag(ctx: Ctx, code: string, x: number, y: number, w: number, h: number) {
  const paint = painters[code];
  if (!paint) return false;
  paint(ctx, x, y, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  return true;
}
