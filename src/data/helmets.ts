// Level C abstract helmets (spec §9.2): a shared shell painted in colours drawn
// from the driver's national flag. They are deliberately not replicas of any
// driver's real helmet design.
export interface HelmetPalette {
  shell: string;
  band: string;
  crown: string;
}

const byCountry: Record<string, HelmetPalette> = {
  IT: { shell: "#e9e5dc", band: "#2f7a50", crown: "#b8252e" },
  AR: { shell: "#e9e5dc", band: "#6fa8d6", crown: "#6fa8d6" },
  GB: { shell: "#1f2d57", band: "#e9e5dc", crown: "#b8252e" },
  US: { shell: "#e9e5dc", band: "#1f2d57", crown: "#b8252e" },
  AT: { shell: "#b8252e", band: "#e9e5dc", crown: "#b8252e" },
  CA: { shell: "#e9e5dc", band: "#b8252e", crown: "#b8252e" },
  ZA: { shell: "#1f5e3f", band: "#d1a23a", crown: "#e9e5dc" },
  FR: { shell: "#23367a", band: "#e9e5dc", crown: "#b8252e" },
  DE: { shell: "#1c1c1f", band: "#b8252e", crown: "#c9a23f" },
  FI: { shell: "#e9e5dc", band: "#23509a", crown: "#23509a" },
  ES: { shell: "#b8252e", band: "#d9ae3c", crown: "#b8252e" },
  MC: { shell: "#e9e5dc", band: "#b8252e", crown: "#b8252e" },
};

export const helmetPalette = (countryCode: string): HelmetPalette =>
  byCountry[countryCode] ?? { shell: "#c71722", band: "#e9e5dc", crown: "#1c1c1f" };
