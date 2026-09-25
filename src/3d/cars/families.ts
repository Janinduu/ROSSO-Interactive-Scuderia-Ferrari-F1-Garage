import type { Ring } from "./geometry";

// Era families (spec §10.2 Tier 2): one parametric description per period of
// Formula 1 car architecture. Proportions are approximate and illustrative —
// these are historically informed interpretations, not replicas.

export type FamilyId =
  | "front50s"
  | "rear60s"
  | "wing70s"
  | "flat80s"
  | "v10"
  | "hybrid14"
  | "wide17"
  | "ground22"
  | "active26";

export interface WingSpec {
  x: number;
  y: number;
  span: number;
  chord: number;
  elements: number;
  endplate: number;
  /** Tips curl upwards (2022 regulations). */
  sweepUp?: number;
}

export interface CarSpec {
  year?: number;
  engineCylinders?: number;
  family: FamilyId;
  familyLabel: string;
  frontAxle: number;
  rearAxle: number;
  /** Half track: lateral distance of each wheel centre. */
  trackF: number;
  trackR: number;
  tyreF: { r: number; w: number };
  tyreR: { r: number; w: number };
  rimR: number;
  rim: "wire" | "cast" | "modern" | "big18";
  grooved: boolean;
  tub: Ring[];
  cover?: Ring[];
  airbox: "none" | "tall" | "hoop";
  engineFront: boolean;
  exposedEngine?: { x0: number; x1: number; w: number; h: number; y: number };
  frontWing: WingSpec | null;
  wingPillars: boolean;
  rearWing: WingSpec | null;
  beamWing: number | null;
  rearPylon: "central" | "endplate";
  pods: {
    x0: number;
    x1: number;
    z: number;
    w: number;
    y: number;
    h: number;
    n: number;
  } | null;
  panniers: boolean;
  floor: { x0: number; x1: number; w: number } | null;
  diffuser: { x0: number; x1: number; w: number; rise: number } | null;
  bargeboards: number;
  halo: boolean;
  sharkFin: boolean;
  periscopes: boolean;
  windscreen: boolean;
  grille: "none" | "oval" | "twin";
  cockpit: { x0: number; x1: number; y: number };
  driver: { x: number; y: number };
  roundels: boolean;
  wheelCovers: boolean;
  accent: "none" | "stripe" | "nose" | "wing";
}

const base = {
  grooved: false,
  exposedEngine: undefined,
  wingPillars: false,
  beamWing: null,
  rearPylon: "endplate" as const,
  panniers: false,
  bargeboards: 0,
  halo: false,
  sharkFin: false,
  periscopes: false,
  windscreen: false,
  grille: "none" as const,
  roundels: false,
  wheelCovers: false,
  accent: "none" as const,
};

const eraFamilies: Record<Exclude<FamilyId, "active26">, CarSpec> = {
  front50s: {
    ...base,
    family: "front50s",
    familyLabel: "Front-engined Grand Prix car, 1950s",
    frontAxle: -1.1,
    rearAxle: 1.1,
    trackF: 0.63,
    trackR: 0.6,
    tyreF: { r: 0.37, w: 0.15 },
    tyreR: { r: 0.38, w: 0.17 },
    rimR: 0.22,
    rim: "wire",
    tub: [
      { x: -1.96, w: 0.19, y: 0.55, h: 0.17, n: 2.2 },
      { x: -1.82, w: 0.25, y: 0.56, h: 0.22 },
      { x: -1.3, w: 0.29, y: 0.58, h: 0.25 },
      { x: -0.5, w: 0.31, y: 0.6, h: 0.27 },
      { x: 0.15, w: 0.33, y: 0.58, h: 0.27 },
      { x: 0.75, w: 0.32, y: 0.58, h: 0.26 },
      { x: 1.3, w: 0.26, y: 0.6, h: 0.23 },
      { x: 1.75, w: 0.15, y: 0.62, h: 0.15 },
      { x: 1.97, w: 0.04, y: 0.63, h: 0.04 },
    ],
    airbox: "none",
    engineFront: true,
    frontWing: null,
    rearWing: null,
    pods: null,
    floor: null,
    diffuser: null,
    windscreen: true,
    grille: "oval",
    cockpit: { x0: 0.05, x1: 0.62, y: 0.86 },
    driver: { x: 0.42, y: 1.0 },
    roundels: true,
  },
  rear60s: {
    ...base,
    family: "rear60s",
    familyLabel: "Rear-engined car before wings, 1960s",
    frontAxle: -1.15,
    rearAxle: 1.15,
    trackF: 0.64,
    trackR: 0.63,
    tyreF: { r: 0.3, w: 0.16 },
    tyreR: { r: 0.31, w: 0.2 },
    rimR: 0.2,
    rim: "wire",
    tub: [
      { x: -1.96, w: 0.13, y: 0.4, h: 0.12 },
      { x: -1.78, w: 0.2, y: 0.4, h: 0.17 },
      { x: -1.3, w: 0.25, y: 0.41, h: 0.2 },
      { x: -0.6, w: 0.28, y: 0.42, h: 0.22 },
      { x: 0, w: 0.3, y: 0.43, h: 0.23 },
      { x: 0.6, w: 0.28, y: 0.43, h: 0.22 },
      { x: 1.2, w: 0.22, y: 0.44, h: 0.18 },
      { x: 1.7, w: 0.13, y: 0.45, h: 0.12 },
      { x: 1.96, w: 0.04, y: 0.46, h: 0.04 },
    ],
    airbox: "none",
    engineFront: false,
    frontWing: null,
    rearWing: null,
    pods: null,
    floor: null,
    diffuser: null,
    windscreen: true,
    grille: "oval",
    cockpit: { x0: -0.35, x1: 0.25, y: 0.64 },
    driver: { x: 0.05, y: 0.8 },
    roundels: true,
  },
  wing70s: {
    ...base,
    family: "wing70s",
    familyLabel: "Winged ground-effect era car, 1970s–early 1980s",
    frontAxle: -1.2,
    rearAxle: 1.32,
    trackF: 0.76,
    trackR: 0.72,
    tyreF: { r: 0.28, w: 0.24 },
    tyreR: { r: 0.34, w: 0.45 },
    rimR: 0.19,
    rim: "cast",
    tub: [
      { x: -1.9, w: 0.2, y: 0.27, h: 0.05, n: 3 },
      { x: -1.6, w: 0.2, y: 0.3, h: 0.08, n: 3 },
      { x: -1.1, w: 0.22, y: 0.35, h: 0.13, n: 3 },
      { x: -0.6, w: 0.25, y: 0.38, h: 0.17, n: 3 },
      { x: -0.1, w: 0.27, y: 0.38, h: 0.19, n: 3 },
      { x: 0.3, w: 0.26, y: 0.36, h: 0.18, n: 3 },
      { x: 0.55, w: 0.2, y: 0.34, h: 0.14, n: 3 },
    ],
    airbox: "tall",
    engineFront: false,
    exposedEngine: { x0: 0.5, x1: 1.45, w: 0.3, h: 0.14, y: 0.3 },
    frontWing: {
      x: -1.72,
      y: 0.3,
      span: 1.55,
      chord: 0.42,
      elements: 1,
      endplate: 0.12,
    },
    rearWing: {
      x: 1.78,
      y: 1.0,
      span: 1.1,
      chord: 0.45,
      elements: 1,
      endplate: 0.34,
    },
    rearPylon: "central",
    pods: { x0: -0.25, x1: 0.55, z: 0.5, w: 0.14, y: 0.33, h: 0.13, n: 4 },
    floor: null,
    diffuser: null,
    windscreen: true,
    cockpit: { x0: -0.5, x1: 0.15, y: 0.56 },
    driver: { x: -0.1, y: 0.78 },
    accent: "stripe",
  },
  flat80s: {
    ...base,
    family: "flat80s",
    familyLabel: "Flat-bottom low-nose car, late 1980s–early 1990s",
    frontAxle: -1.45,
    rearAxle: 1.45,
    trackF: 0.74,
    trackR: 0.69,
    tyreF: { r: 0.32, w: 0.29 },
    tyreR: { r: 0.33, w: 0.4 },
    rimR: 0.19,
    rim: "modern",
    tub: [
      { x: -2.1, w: 0.12, y: 0.24, h: 0.06, n: 2.6 },
      { x: -1.85, w: 0.15, y: 0.28, h: 0.1 },
      { x: -1.4, w: 0.19, y: 0.34, h: 0.15, n: 2.6 },
      { x: -0.9, w: 0.23, y: 0.4, h: 0.2, n: 3 },
      { x: -0.5, w: 0.27, y: 0.42, h: 0.22, n: 3 },
      { x: 0, w: 0.29, y: 0.42, h: 0.24, n: 3 },
      { x: 0.5, w: 0.26, y: 0.4, h: 0.24, n: 3 },
      { x: 1.0, w: 0.2, y: 0.36, h: 0.2, n: 3 },
      { x: 1.5, w: 0.12, y: 0.34, h: 0.14 },
      { x: 1.82, w: 0.05, y: 0.33, h: 0.07 },
    ],
    cover: [
      { x: -0.04, w: 0.1, y: 0.9, h: 0.11 },
      { x: 0.25, w: 0.14, y: 0.88, h: 0.15 },
      { x: 0.7, w: 0.13, y: 0.72, h: 0.18 },
      { x: 1.2, w: 0.09, y: 0.56, h: 0.14 },
      { x: 1.78, w: 0.04, y: 0.42, h: 0.06 },
    ],
    airbox: "hoop",
    engineFront: false,
    frontWing: {
      x: -1.98,
      y: 0.13,
      span: 1.55,
      chord: 0.32,
      elements: 2,
      endplate: 0.18,
    },
    rearWing: {
      x: 1.92,
      y: 0.95,
      span: 0.95,
      chord: 0.38,
      elements: 2,
      endplate: 0.55,
    },
    beamWing: 0.45,
    pods: { x0: -0.6, x1: 1.3, z: 0.45, w: 0.2, y: 0.3, h: 0.17, n: 3 },
    floor: { x0: -0.8, x1: 1.5, w: 0.7 },
    diffuser: { x0: 1.2, x1: 1.9, w: 0.5, rise: 0.15 },
    cockpit: { x0: -0.55, x1: 0.02, y: 0.64 },
    driver: { x: -0.15, y: 0.78 },
    accent: "nose",
  },
  v10: {
    ...base,
    family: "v10",
    familyLabel: "Raised-nose V10 era car, 1990s–2000s",
    frontAxle: -1.55,
    rearAxle: 1.5,
    trackF: 0.74,
    trackR: 0.71,
    tyreF: { r: 0.33, w: 0.3 },
    tyreR: { r: 0.33, w: 0.37 },
    rimR: 0.18,
    rim: "modern",
    tub: [
      { x: -2.22, w: 0.05, y: 0.37, h: 0.04, n: 2.4 },
      { x: -2.05, w: 0.08, y: 0.41, h: 0.07, n: 2.4 },
      { x: -1.7, w: 0.12, y: 0.47, h: 0.11, n: 2.6 },
      { x: -1.25, w: 0.17, y: 0.53, h: 0.15, n: 2.8 },
      { x: -0.85, w: 0.22, y: 0.56, h: 0.18, n: 3 },
      { x: -0.55, w: 0.27, y: 0.52, h: 0.2, n: 3 },
      { x: -0.05, w: 0.3, y: 0.47, h: 0.24, n: 3 },
      { x: 0.35, w: 0.29, y: 0.45, h: 0.25, n: 3 },
      { x: 0.9, w: 0.22, y: 0.4, h: 0.22, n: 3 },
      { x: 1.45, w: 0.13, y: 0.36, h: 0.16, n: 2.6 },
      { x: 1.8, w: 0.06, y: 0.35, h: 0.08 },
    ],
    cover: [
      { x: 0.04, w: 0.1, y: 0.86, h: 0.11 },
      { x: 0.25, w: 0.13, y: 0.86, h: 0.14 },
      { x: 0.6, w: 0.12, y: 0.76, h: 0.16 },
      { x: 1.0, w: 0.09, y: 0.63, h: 0.14 },
      { x: 1.5, w: 0.06, y: 0.5, h: 0.1 },
      { x: 1.85, w: 0.03, y: 0.42, h: 0.05 },
    ],
    airbox: "hoop",
    engineFront: false,
    frontWing: {
      x: -2.1,
      y: 0.1,
      span: 1.6,
      chord: 0.3,
      elements: 2,
      endplate: 0.22,
    },
    wingPillars: true,
    rearWing: {
      x: 1.95,
      y: 0.92,
      span: 0.9,
      chord: 0.3,
      elements: 2,
      endplate: 0.55,
    },
    beamWing: 0.42,
    pods: { x0: -0.55, x1: 1.35, z: 0.46, w: 0.16, y: 0.37, h: 0.19, n: 3 },
    floor: { x0: -0.9, x1: 1.55, w: 0.7 },
    diffuser: { x0: 1.3, x1: 1.95, w: 0.5, rise: 0.18 },
    bargeboards: 2,
    periscopes: true,
    cockpit: { x0: -0.55, x1: 0.02, y: 0.72 },
    driver: { x: -0.15, y: 0.8 },
    accent: "nose",
  },
  hybrid14: {
    ...base,
    family: "hybrid14",
    familyLabel: "Narrow-tyre aero era car, 2009–2016",
    frontAxle: -1.75,
    rearAxle: 1.6,
    trackF: 0.74,
    trackR: 0.7,
    tyreF: { r: 0.33, w: 0.245 },
    tyreR: { r: 0.33, w: 0.325 },
    rimR: 0.18,
    rim: "modern",
    tub: [
      { x: -2.55, w: 0.05, y: 0.24, h: 0.035, n: 2.4 },
      { x: -2.35, w: 0.08, y: 0.32, h: 0.06 },
      { x: -2.0, w: 0.12, y: 0.43, h: 0.1 },
      { x: -1.5, w: 0.17, y: 0.51, h: 0.14, n: 2.8 },
      { x: -1.0, w: 0.23, y: 0.55, h: 0.18, n: 3 },
      { x: -0.6, w: 0.28, y: 0.52, h: 0.21, n: 3 },
      { x: -0.1, w: 0.31, y: 0.48, h: 0.25, n: 3 },
      { x: 0.35, w: 0.29, y: 0.46, h: 0.26, n: 3 },
      { x: 0.9, w: 0.21, y: 0.42, h: 0.22, n: 3 },
      { x: 1.45, w: 0.12, y: 0.38, h: 0.15 },
      { x: 1.85, w: 0.05, y: 0.36, h: 0.07 },
    ],
    cover: [
      { x: 0.02, w: 0.1, y: 0.88, h: 0.12 },
      { x: 0.25, w: 0.14, y: 0.89, h: 0.15 },
      { x: 0.65, w: 0.12, y: 0.78, h: 0.17 },
      { x: 1.15, w: 0.08, y: 0.62, h: 0.14 },
      { x: 1.65, w: 0.05, y: 0.5, h: 0.1 },
      { x: 1.95, w: 0.03, y: 0.44, h: 0.05 },
    ],
    airbox: "hoop",
    engineFront: false,
    frontWing: {
      x: -2.35,
      y: 0.09,
      span: 1.65,
      chord: 0.36,
      elements: 3,
      endplate: 0.26,
    },
    wingPillars: true,
    rearWing: {
      x: 2.02,
      y: 1.0,
      span: 0.75,
      chord: 0.35,
      elements: 2,
      endplate: 0.6,
    },
    pods: { x0: -0.7, x1: 1.25, z: 0.47, w: 0.17, y: 0.4, h: 0.19, n: 3 },
    floor: { x0: -1.1, x1: 1.7, w: 0.7 },
    diffuser: { x0: 1.4, x1: 2.1, w: 0.5, rise: 0.17 },
    bargeboards: 3,
    cockpit: { x0: -0.6, x1: 0.0, y: 0.74 },
    driver: { x: -0.2, y: 0.82 },
    accent: "wing",
  },
  wide17: {
    ...base,
    family: "wide17",
    familyLabel: "Wide-body halo era car, 2017–2021",
    frontAxle: -1.95,
    rearAxle: 1.65,
    trackF: 0.8,
    trackR: 0.78,
    tyreF: { r: 0.33, w: 0.305 },
    tyreR: { r: 0.33, w: 0.405 },
    rimR: 0.18,
    rim: "modern",
    tub: [
      { x: -2.78, w: 0.05, y: 0.26, h: 0.035, n: 2.4 },
      { x: -2.6, w: 0.08, y: 0.33, h: 0.06 },
      { x: -2.2, w: 0.12, y: 0.43, h: 0.1 },
      { x: -1.7, w: 0.17, y: 0.5, h: 0.14, n: 2.8 },
      { x: -1.2, w: 0.23, y: 0.55, h: 0.18, n: 3 },
      { x: -0.75, w: 0.29, y: 0.52, h: 0.21, n: 3 },
      { x: -0.25, w: 0.32, y: 0.48, h: 0.25, n: 3 },
      { x: 0.2, w: 0.3, y: 0.46, h: 0.26, n: 3 },
      { x: 0.8, w: 0.22, y: 0.42, h: 0.22, n: 3 },
      { x: 1.4, w: 0.13, y: 0.38, h: 0.15 },
      { x: 1.9, w: 0.06, y: 0.36, h: 0.08 },
    ],
    cover: [
      { x: -0.12, w: 0.1, y: 0.88, h: 0.12 },
      { x: 0.1, w: 0.14, y: 0.9, h: 0.16 },
      { x: 0.5, w: 0.12, y: 0.8, h: 0.18 },
      { x: 1.1, w: 0.08, y: 0.64, h: 0.15 },
      { x: 1.7, w: 0.05, y: 0.5, h: 0.1 },
      { x: 2.0, w: 0.03, y: 0.44, h: 0.05 },
    ],
    airbox: "hoop",
    engineFront: false,
    frontWing: {
      x: -2.55,
      y: 0.09,
      span: 1.8,
      chord: 0.38,
      elements: 4,
      endplate: 0.3,
    },
    wingPillars: true,
    rearWing: {
      x: 2.12,
      y: 0.92,
      span: 1.0,
      chord: 0.4,
      elements: 2,
      endplate: 0.5,
    },
    beamWing: 0.5,
    pods: { x0: -0.8, x1: 1.3, z: 0.5, w: 0.17, y: 0.42, h: 0.18, n: 3 },
    floor: { x0: -1.2, x1: 1.8, w: 0.8 },
    diffuser: { x0: 1.5, x1: 2.25, w: 0.55, rise: 0.22 },
    bargeboards: 4,
    halo: true,
    sharkFin: true,
    cockpit: { x0: -0.75, x1: -0.15, y: 0.74 },
    driver: { x: -0.35, y: 0.82 },
    accent: "wing",
  },
  ground22: {
    ...base,
    family: "ground22",
    familyLabel: "Ground-effect era car, 2022 onwards",
    frontAxle: -2.0,
    rearAxle: 1.6,
    trackF: 0.8,
    trackR: 0.78,
    tyreF: { r: 0.36, w: 0.31 },
    tyreR: { r: 0.36, w: 0.4 },
    rimR: 0.24,
    rim: "big18",
    tub: [
      { x: -2.72, w: 0.07, y: 0.2, h: 0.04, n: 2.4 },
      { x: -2.5, w: 0.1, y: 0.28, h: 0.07 },
      { x: -2.1, w: 0.14, y: 0.4, h: 0.11 },
      { x: -1.6, w: 0.19, y: 0.49, h: 0.15, n: 2.8 },
      { x: -1.1, w: 0.25, y: 0.54, h: 0.19, n: 3 },
      { x: -0.65, w: 0.3, y: 0.51, h: 0.22, n: 3 },
      { x: -0.15, w: 0.32, y: 0.48, h: 0.26, n: 3 },
      { x: 0.35, w: 0.3, y: 0.46, h: 0.26, n: 3 },
      { x: 0.9, w: 0.22, y: 0.42, h: 0.22, n: 3 },
      { x: 1.45, w: 0.13, y: 0.38, h: 0.15 },
      { x: 1.9, w: 0.06, y: 0.36, h: 0.08 },
    ],
    cover: [
      { x: -0.05, w: 0.1, y: 0.88, h: 0.12 },
      { x: 0.2, w: 0.15, y: 0.9, h: 0.16 },
      { x: 0.6, w: 0.14, y: 0.78, h: 0.19 },
      { x: 1.15, w: 0.1, y: 0.62, h: 0.16 },
      { x: 1.7, w: 0.05, y: 0.5, h: 0.1 },
      { x: 2.0, w: 0.03, y: 0.44, h: 0.05 },
    ],
    airbox: "hoop",
    engineFront: false,
    frontWing: {
      x: -2.5,
      y: 0.1,
      span: 1.9,
      chord: 0.45,
      elements: 4,
      endplate: 0.26,
      sweepUp: 0.12,
    },
    rearWing: {
      x: 2.05,
      y: 0.95,
      span: 1.0,
      chord: 0.42,
      elements: 2,
      endplate: 0.45,
    },
    beamWing: 0.55,
    pods: { x0: -0.7, x1: 1.35, z: 0.55, w: 0.22, y: 0.42, h: 0.2, n: 3 },
    floor: { x0: -1.0, x1: 1.9, w: 0.9 },
    diffuser: { x0: 1.45, x1: 2.2, w: 0.6, rise: 0.3 },
    halo: true,
    wheelCovers: true,
    cockpit: { x0: -0.65, x1: -0.05, y: 0.74 },
    driver: { x: -0.25, y: 0.82 },
    accent: "wing",
  },
};

// 2026 rules: a shorter, narrower car with narrower tyres and movable wings.
export const families: Record<FamilyId, CarSpec> = {
  ...eraFamilies,
  active26: {
    ...eraFamilies.ground22,
    family: "active26",
    familyLabel: "Active-aero era car, 2026 regulations",
    frontAxle: -1.85,
    rearAxle: 1.55,
    trackF: 0.76,
    trackR: 0.74,
    tyreF: { r: 0.36, w: 0.285 },
    tyreR: { r: 0.36, w: 0.37 },
    frontWing: {
      x: -2.35,
      y: 0.1,
      span: 1.8,
      chord: 0.42,
      elements: 3,
      endplate: 0.22,
    },
    rearWing: {
      x: 1.95,
      y: 0.95,
      span: 0.95,
      chord: 0.4,
      elements: 2,
      endplate: 0.45,
    },
    beamWing: null,
    floor: { x0: -0.9, x1: 1.8, w: 0.82 },
    diffuser: { x0: 1.4, x1: 2.05, w: 0.55, rise: 0.22 },
    wheelCovers: false,
  },
};

/** The family whose architecture matches a championship year. */
export function familyForYear(year: number): FamilyId {
  if (year <= 1960) return "front50s";
  if (year <= 1967) return "rear60s";
  if (year <= 1982) return "wing70s";
  if (year <= 1994) return "flat80s";
  if (year <= 2008) return "v10";
  if (year <= 2016) return "hybrid14";
  if (year <= 2021) return "wide17";
  if (year <= 2025) return "ground22";
  return "active26";
}

/**
 * Regulation-driven details within a family: grooved dry tyres (1998–2008),
 * the halo (2018 onwards), the 1961–62 twin-nostril nose.
 */
export function specForYear(
  family: FamilyId,
  year: number,
  tweaks: Partial<CarSpec> = {},
): CarSpec {
  const spec = families[family];
  return {
    ...spec,
    year,
    airbox: family === "wing70s" && year >= 1976 ? "none" : spec.airbox,
    engineCylinders:
      year <= 1951
        ? 12
        : year <= 1955
          ? 4
          : year <= 1960
            ? year >= 1958
              ? 6
              : 8
            : year <= 1963
              ? 6
              : year === 1964
                ? 8
                : year <= 1980
                  ? 12
                  : year <= 1988
                    ? 6
                    : year <= 1995
                      ? 12
                      : year <= 2005
                        ? 10
                        : year <= 2013
                          ? 8
                          : 6,
    grooved: year >= 1998 && year <= 2008,
    halo: year >= 2018,
    grille:
      family === "rear60s" && (year === 1961 || year === 1962)
        ? "twin"
        : spec.grille,
    // The beam wing was absent from 2014 until the 2022 rules.
    beamWing: year >= 2014 && year <= 2021 ? null : spec.beamWing,
    ...tweaks,
  };
}
