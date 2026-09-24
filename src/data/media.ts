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
  /** Extra crop beyond cover-fit, e.g. to trim a magazine masthead. */
  zoom?: number;
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

// Owner-supplied photos override the Commons set on the owner's machine. Their
// usage rights are not established, so they live in a git-ignored folder and
// never ship from the public repository.
const localFiles = import.meta.glob<string>(
  "../assets/portraits-local/*.{jpg,jpeg,png,webp}",
  { eager: true, import: "default", query: "?url" },
);
const localDetails: Record<string, Pick<DriverPortrait, "alt" | "focalPoint">> = {
  hamilton: {
    alt: "Lewis Hamilton in Ferrari race overalls celebrating on the podium with a winner's trophy",
    focalPoint: [0.52, 0.31],
  },
  prost: {
    alt: "Alain Prost in Ferrari race overalls raising a trophy on the podium at the French Grand Prix",
    focalPoint: [0.58, 0.5],
  },
  phil_hill: {
    alt: "Phil Hill at the wheel of a Ferrari, wearing a period helmet and goggles",
    focalPoint: [0.6, 0.34],
  },
  hawthorn: {
    alt: "Mike Hawthorn racing a red Ferrari",
    focalPoint: [0.3, 0.2],
  },
  fangio: {
    alt: "Juan Manuel Fangio seated in a Ferrari, wearing a helmet with goggles raised",
    focalPoint: [0.6, 0.38],
  },
};
const localPortraits: Record<string, DriverPortrait> = Object.fromEntries(
  Object.entries(localFiles).map(([path, src]) => {
    const id = path.split("/").at(-1)!.replace(/\.\w+$/, "");
    return [
      id,
      {
        src,
        alt: localDetails[id]?.alt ?? "Driver photograph",
        focalPoint: localDetails[id]?.focalPoint ?? [0.5, 0.3],
        credit: {
          sourceUrl: "",
          license: "Supplied by the project owner; rights not verified",
          attribution: "Photo supplied by the project owner (local build only)",
        },
      },
    ];
  }),
);

export const getPortrait = (driverId: string): DriverPortrait | undefined =>
  localPortraits[driverId] ?? portraits[driverId];

// Optional team emblem for the bay boards. Trademarked logos are not
// distributed with this repository: an owner who has decided to use one places
// it at src/assets/brand/team-emblem.(svg|png|webp), which is git-ignored.
const emblemFiles = import.meta.glob<string>(
  "../assets/brand/team-emblem.{svg,png,webp}",
  { eager: true, import: "default", query: "?url" },
);
export const teamEmblemSrc: string | null =
  Object.values(emblemFiles)[0] ?? null;
