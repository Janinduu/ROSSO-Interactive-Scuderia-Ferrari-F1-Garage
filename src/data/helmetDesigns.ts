import type { HelmetDesign } from "../3d/helmets/helmetArt";
import type { Driver } from "./drivers";
import { helmetPalette } from "./helmets";

// Each driver's Ferrari-era helmet, described as colours and shapes (Level B,
// spec §9.2): the design language of the real helmet, without sponsor marks.
const files = import.meta.glob<Record<string, HelmetDesign>>("./helmetDesigns.json", {
  eager: true,
  import: "default",
});
const designs: Record<string, HelmetDesign> = Object.values(files)[0] ?? {};

export function helmetDesignFor(driver: Driver): HelmetDesign {
  const researched = designs[driver.id];
  if (researched) return researched;
  // Fallback: an abstract helmet in national colours (Level C).
  const p = helmetPalette(driver.flag);
  return {
    helmetType: "full-face",
    base: p.shell,
    visorSurround: "#111214",
    visorTint: "dark",
    layers: [
      { shape: "crown", v1: 0.22, color: p.crown },
      { shape: "band", v0: 0.3, v1: 0.36, color: p.band },
    ],
  };
}
