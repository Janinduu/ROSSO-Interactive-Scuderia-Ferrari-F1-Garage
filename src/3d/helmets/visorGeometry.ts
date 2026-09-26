import { BufferGeometry, Float32BufferAttribute } from 'three';
import { tube } from '../cars/geometry';

// A shield wraps around the face, with swept, rounded ends at its pivots.
// Front is -X, matching the shell and its painted UV coordinates.
export function shieldPoint(u: number, v: number, year: number): [number, number, number] {
  const a = u * 1.02;
  const edge = Math.pow(Math.abs(u), 5);
  const top = (year >= 2018 ? .43 : .49) - .13 * edge;
  const bottom = .035 + .15 * edge;
  const y = bottom + (top - bottom) * v;
  const r = Math.sqrt(1 - Math.pow(y / 1.04, 2));
  return [-1.14 * r * Math.cos(a), y, .938 * r * Math.sin(a)];
}

export function visorGeometry(year: number) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const nx = 64, ny = 12;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    positions.push(...shieldPoint(i / nx * 2 - 1, j / ny, year));
    uv.push(i / nx, j / ny);
    if (i < nx && j < ny) {
      const k = j * (nx + 1) + i;
      indices.push(k, k + 1, k + nx + 1, k + 1, k + nx + 2, k + nx + 1);
    }
  }
  const shield = new BufferGeometry();
  shield.setAttribute('position', new Float32BufferAttribute(positions, 3));
  shield.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  shield.setIndex(indices);
  shield.computeVertexNormals();
  const perimeter: [number, number, number][] = [];
  for (let i = 0; i <= nx; i++) perimeter.push(shieldPoint(i / nx * 2 - 1, 0, year));
  for (let i = nx; i >= 0; i--) perimeter.push(shieldPoint(i / nx * 2 - 1, 1, year));
  perimeter.push(perimeter[0]);
  return { shield, gasket: tube(perimeter, .014) };
}
