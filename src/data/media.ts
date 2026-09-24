// Third-party media records (spec §8.2, §27). Every portrait carries its
// licence and attribution; nothing is displayed without a credit record.
export interface MediaCredit {
  creator?: string;
  sourceUrl: string;
  license: string;
  licenseUrl?: string;
  attribution: string;
  originalFileUrl?: string;
}
export interface DriverPortrait {
  src: string;
  alt: string;
  credit: MediaCredit;
  /** Face centre as fractions of width/height, used when cropping. */
  focalPoint?: [number, number];
  year?: number | null;
  ferrariContext?: "suit" | "car" | "period" | "none";
  downloaded?: string;
}

// portraits.json is produced by the portrait research step. It is optional so
// the museum still builds, with initials fallbacks, before it exists.
const portraitFiles = import.meta.glob<Record<string, DriverPortrait>>(
  "./portraits.json",
  { eager: true, import: "default" },
);
const portraits: Record<string, DriverPortrait> =
  Object.values(portraitFiles)[0] ?? {};

export const getPortrait = (driverId: string): DriverPortrait | undefined =>
  portraits[driverId];

// Optional team emblem for the bay boards. Trademarked logos are not
// distributed with this repository: an owner who has decided to use one places
// it at src/assets/brand/team-emblem.(svg|png|webp), which is git-ignored.
const emblemFiles = import.meta.glob<string>(
  "../assets/brand/team-emblem.{svg,png,webp}",
  { eager: true, import: "default", query: "?url" },
);
export const teamEmblemSrc: string | null =
  Object.values(emblemFiles)[0] ?? null;
