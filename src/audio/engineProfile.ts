import cars from "../data/carsByYear.json";

// How a car's engine is voiced by the synthesiser. The layout comes from the
// sourced engine description in carsByYear.json; rev ranges are period-typical
// values used only to shape the sound (they are never shown as facts).
export interface EngineProfile {
  cylinders: number;
  layout: "inline" | "vee" | "flat";
  turbo: boolean;
  hybrid: boolean;
  supercharged: boolean;
  idleRpm: number;
  peakRpm: number;
  /** Plain-language description for the caption. */
  label: string;
}

const table = (cars as unknown as { _cars: Record<string, { engine?: string }> })._cars;

function revRange(year: number): [number, number] {
  if (year <= 1960) return [2200, 7500];
  if (year <= 1967) return [3000, 10500];
  if (year <= 1980) return [3500, 12200];
  if (year <= 1988) return [3500, 11500];
  if (year <= 1994) return [4000, 13500];
  if (year <= 2005) return [4500, 18500];
  if (year <= 2013) return [4500, 18000];
  return [4000, 12500];
}

export function engineProfile(carName: string | null, year: number): EngineProfile {
  const text =
    (carName && table[carName]?.engine) ??
    // Unsourced cars fall back to their era's layout.
    (year >= 2014 ? "1.6 V6 turbo hybrid" : year >= 2006 ? "2.4 V8" : year >= 1996 ? "3.0 V10" : "V12");
  const m = text.match(/(V|flat-|inline-)(\d+)/i);
  const kind = m?.[1].toLowerCase() ?? "v";
  const cylinders = Number(m?.[2] ?? 12);
  const [idleRpm, peakRpm] = revRange(year);
  return {
    cylinders,
    layout: kind.startsWith("flat") ? "flat" : kind.startsWith("inline") ? "inline" : "vee",
    turbo: /turbo/i.test(text),
    hybrid: /hybrid|kers/i.test(text),
    supercharged: /supercharged/i.test(text),
    idleRpm,
    peakRpm,
    label: text,
  };
}
