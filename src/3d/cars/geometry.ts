import {
  BufferGeometry,
  CatmullRomCurve3,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";

// Geometry primitives for the procedural car studies. All cars point towards
// -X with Y up; lengths are roughly metres.

/** One cross-section of a lofted body: a superellipse centred at (x, y, z). */
export interface Ring {
  x: number;
  /** Half width (Z). */
  w: number;
  /** Centre height. */
  y: number;
  /** Half height. */
  h: number;
  /** Lateral centre, for side-mounted bodies such as sidepods. */
  z?: number;
  /** Superellipse exponent: 2 = ellipse, higher = boxier. */
  n?: number;
}

/** Loft a smooth closed body through a list of rings, front to back. */
export function loft(rings: Ring[], segments = 28): BufferGeometry {
  // Intermediate sections remove the conspicuous straight-sided facets while
  // retaining the authored cross sections and their end points.
  const controls = rings;
  const interpolate = (a: number, b: number, c: number, d: number, t: number) =>
    0.5 *
    (2 * b +
      (-a + c) * t +
      (2 * a - 5 * b + 4 * c - d) * t * t +
      (-a + 3 * b - 3 * c + d) * t * t * t);
  rings = controls.flatMap((r, i) => {
    if (i === controls.length - 1) return [r];
    const prev = controls[Math.max(0, i - 1)],
      next = controls[i + 1],
      end = controls[Math.min(controls.length - 1, i + 2)];
    return Array.from({ length: 5 }, (_, j) => {
      const t = j / 5;
      return {
        x: r.x + (next.x - r.x) * t,
        w: Math.max(0.005, interpolate(prev.w, r.w, next.w, end.w, t)),
        h: Math.max(0.005, interpolate(prev.h, r.h, next.h, end.h, t)),
        y: interpolate(prev.y, r.y, next.y, end.y, t),
        z: interpolate(prev.z ?? 0, r.z ?? 0, next.z ?? 0, end.z ?? 0, t),
        n: (r.n ?? 2) + ((next.n ?? 2) - (r.n ?? 2)) * t,
      };
    });
  });
  const vertices: number[] = [];
  const indices: number[] = [];
  const signed = (v: number, p: number) => Math.sign(v) * Math.abs(v) ** p;
  rings.forEach((r) => {
    const p = 2 / (r.n ?? 2);
    for (let j = 0; j <= segments; j++) {
      const t = (j / segments) * Math.PI * 2;
      vertices.push(
        r.x,
        r.y + signed(Math.sin(t), p) * r.h,
        (r.z ?? 0) + signed(Math.cos(t), p) * r.w,
      );
    }
  });
  for (let i = 0; i < rings.length - 1; i++)
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j;
      const b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  // Close both ends with fans so no body is ever see-through.
  const cap = (ring: number, flip: boolean) => {
    const r = rings[ring];
    const centre = vertices.length / 3;
    vertices.push(r.x, r.y, r.z ?? 0);
    const start = ring * (segments + 1);
    for (let j = 0; j < segments; j++)
      indices.push(
        ...(flip
          ? [centre, start + j + 1, start + j]
          : [centre, start + j, start + j + 1]),
      );
  };
  cap(0, true);
  cap(rings.length - 1, false);
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/**
 * An inverted (downforce) aerofoil extruded along Z and centred on the span.
 * The leading edge faces -X.
 */
export function aerofoil(
  chord: number,
  span: number,
  thickness = 0.1,
  camber = 0.06,
) {
  const shape = new Shape();
  const n = 18;
  const upper: Vector2[] = [];
  const lower: Vector2[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (1 - Math.cos((i / n) * Math.PI)) / 2;
    const t =
      5 *
      thickness *
      (0.2969 * Math.sqrt(x) -
        0.126 * x -
        0.3516 * x ** 2 +
        0.2843 * x ** 3 -
        0.1036 * x ** 4);
    // Camber points downwards: the wing pushes the car into the track.
    const c = -camber * 4 * x * (1 - x);
    upper.push(new Vector2(x * chord, (c + t) * chord));
    lower.push(new Vector2(x * chord, (c - t) * chord));
  }
  shape.moveTo(upper[0].x, upper[0].y);
  upper.slice(1).forEach((p) => shape.lineTo(p.x, p.y));
  lower
    .slice(0, -1)
    .reverse()
    .forEach((p) => shape.lineTo(p.x, p.y));
  const g = new ExtrudeGeometry(shape, {
    depth: span,
    steps: 32,
    bevelEnabled: false,
    curveSegments: 1,
  });
  g.translate(-chord / 2, 0, -span / 2);
  g.computeVertexNormals();
  return g;
}

/** Planform follows the wheel clearance, floor edge and narrowed rear throat. */
export function floorPanel(x0: number, x1: number, width: number) {
  const length = x1 - x0;
  const shape = new Shape();
  shape.moveTo(x0, -width * 0.65);
  shape.lineTo(x0 + length * 0.12, -width);
  shape.lineTo(x1 - length * 0.21, -width);
  shape.lineTo(x1, -width * 0.57);
  shape.lineTo(x1, width * 0.57);
  shape.lineTo(x1 - length * 0.21, width);
  shape.lineTo(x0 + length * 0.12, width);
  shape.lineTo(x0, width * 0.65);
  shape.closePath();
  const g = new ExtrudeGeometry(shape, { depth: 0.018, bevelEnabled: false });
  g.rotateX(Math.PI / 2);
  g.translate(0, 0.069, 0);
  return g;
}

/** Tyre with rounded shoulders, axle along Z. */
export function tyre(radius: number, width: number, rimRadius: number) {
  const hw = width / 2;
  const s = Math.min(0.06, width * 0.18);
  const points = [
    new Vector2(rimRadius, -hw * 0.94),
    new Vector2(radius - s, -hw),
    new Vector2(radius - s * 0.25, -hw + s * 0.35),
    new Vector2(radius, -hw + s),
    new Vector2(radius, hw - s),
    new Vector2(radius - s * 0.25, hw - s * 0.35),
    new Vector2(radius - s, hw),
    new Vector2(rimRadius, hw * 0.94),
  ];
  const g = new LatheGeometry(points, 48);
  g.rotateX(Math.PI / 2);
  return g;
}

/** A smooth tube through points, e.g. the halo or exhaust pipes. */
export function tube(
  points: [number, number, number][],
  radius: number,
  closed = false,
) {
  const curve = new CatmullRomCurve3(
    points.map((p) => new Vector3(...p)),
    closed,
  );
  return new TubeGeometry(curve, 48, radius, 10, closed);
}
