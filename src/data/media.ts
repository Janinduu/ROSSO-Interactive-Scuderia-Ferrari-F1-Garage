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

// Team emblem for the signs above the bay boards. An owner may place their own
// at src/assets/brand/team-emblem.(svg|png|webp) (git-ignored); otherwise the
// public build uses the Ferrari wordmark from Wikimedia Commons, credited below.
const emblemFiles = import.meta.glob<string>(
  "../assets/brand/team-emblem.{svg,png,webp}",
  { eager: true, import: "default", query: "?url" },
);
const localEmblem: string | null = Object.values(emblemFiles)[0] ?? null;
export const teamEmblemSrc: string = localEmblem ?? `${import.meta.env.BASE_URL}brand/ferrari-wordmark.svg`;

// Optional team shield for car liveries, installed locally like the emblem.
const shieldFiles = import.meta.glob<string>(
  "../assets/brand/team-shield.{svg,png,webp}",
  { eager: true, import: "default", query: "?url" },
);
export const teamShieldSrc: string | null = Object.values(shieldFiles)[0] ?? null;

// The shield that floats in the Hall of Champions and the Legacy room: the
// owner's local shield if present, otherwise a credited Commons photograph.
export const beaconShieldSrc: string =
  teamShieldSrc ?? `${import.meta.env.BASE_URL}brand/ferrari-scudetto.webp`;

// Credits for the Commons brand marks, listed only when they are in use.
// Both remain trademarks of Ferrari S.p.A.; their use here is descriptive and
// non-commercial, and does not imply any endorsement.
export const brandCredits: MediaCredit[] = [
  ...(localEmblem
    ? []
    : [
        {
          creator: "Ezarate",
          sourceUrl: "https://commons.wikimedia.org/wiki/File:Ferrari_wordmark.svg",
          license: "Public domain (text logo); trademark of Ferrari S.p.A.",
          attribution:
            "Ferrari wordmark: Wikimedia Commons (Ezarate), public domain as a text logo. A trademark of Ferrari S.p.A.",
          originalFileUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Ferrari_wordmark.svg",
        },
      ]),
  ...(teamShieldSrc
    ? []
    : [
        {
          creator: "Auge=mit",
          sourceUrl: "https://commons.wikimedia.org/wiki/File:Ferrari_F430_EngineLogo_Scudetto_rosso_noBG.png",
          license: "CC BY-SA 4.0",
          licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
          attribution:
            "Ferrari F430 engine badge (Scudetto rosso): photograph by Auge=mit, Wikimedia Commons, CC BY-SA 4.0. Resized and shadow removed; this adaptation is shared under CC BY-SA 4.0. The shield is a trademark of Ferrari S.p.A.",
          originalFileUrl:
            "https://upload.wikimedia.org/wikipedia/commons/b/b8/Ferrari_F430_EngineLogo_Scudetto_rosso_noBG.png",
        },
      ]),
];
