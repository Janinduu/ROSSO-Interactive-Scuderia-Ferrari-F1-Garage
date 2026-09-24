import { useMemo, useEffect } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  MeshStandardMaterial,
  Vector3,
  Quaternion,
} from "three";
import type { ThreeElements } from "@react-three/fiber";

// Original, intentionally generic geometry. It is not a replica of a Ferrari chassis.
// Keep this interface stable when replacing the procedural mesh with a licensed GLB.
export interface CarProps {
  era: "classic" | "v10" | "modern";
}
function shell(rings: number[][]) {
  const vertices: number[] = [];
  const indices: number[] = [];
  const n = 16;
  rings.forEach(([x, width, center, height]) => {
    for (let j = 0; j <= n; j++) {
      const t = (j / n) * Math.PI * 2;
      vertices.push(x, center + Math.sin(t) * height, Math.cos(t) * width);
    }
  });
  for (let i = 0; i < rings.length - 1; i++)
    for (let j = 0; j < n; j++) {
      const a = i * (n + 1) + j,
        b = a + n + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
function Rod({
  a,
  b,
  material,
  radius = 0.022,
}: {
  a: [number, number, number];
  b: [number, number, number];
  material: MeshStandardMaterial;
  radius?: number;
}) {
  const start = new Vector3(...a),
    end = new Vector3(...b),
    direction = end.clone().sub(start);
  return (
    <mesh
      position={start.add(end).multiplyScalar(0.5)}
      quaternion={new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        direction.clone().normalize(),
      )}
      material={material}
    >
      <cylinderGeometry args={[radius, radius, direction.length(), 6]} />
    </mesh>
  );
}
export default function Car({ era }: CarProps) {
  const mats = useMemo(
    () => ({
      red: new MeshStandardMaterial({
        color: "#c71722",
        roughness: 0.29,
        metalness: 0.48,
      }),
      black: new MeshStandardMaterial({
        color: "#14161a",
        roughness: 0.52,
        metalness: 0.45,
      }),
      rubber: new MeshStandardMaterial({ color: "#111215", roughness: 0.87 }),
      metal: new MeshStandardMaterial({
        color: "#62666b",
        metalness: 0.82,
        roughness: 0.26,
      }),
      white: new MeshStandardMaterial({
        color: "#e5e1d7",
        roughness: 0.45,
        metalness: 0.2,
      }),
    }),
    [],
  );
  const geo = useMemo(
    () =>
      shell([
        [-2.4, 0.09, 0.44, 0.06],
        [-1.9, 0.15, 0.49, 0.1],
        [-1.15, 0.23, 0.62, 0.15],
        [-0.65, 0.34, 0.66, 0.23],
        [0.0, 0.36, 0.66, 0.24],
        [0.55, 0.33, 0.72, 0.34],
        [1.0, 0.25, 0.68, 0.28],
        [1.7, 0.12, 0.47, 0.14],
        [1.85, 0.025, 0.39, 0.06],
      ]),
    [],
  );
  const pod = useMemo(
    () =>
      shell([
        [-0.5, 0.04, 0.42, 0.1],
        [-0.3, 0.29, 0.44, 0.24],
        [0.35, 0.3, 0.43, 0.22],
        [0.95, 0.2, 0.39, 0.16],
        [1.35, 0.03, 0.3, 0.05],
      ]),
    [],
  );
  useEffect(
    () => () => {
      geo.dispose();
      pod.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    },
    [geo, pod, mats],
  );
  const Box = ({
    size,
    material = mats.red,
    ...props
  }: {
    size: [number, number, number];
    material?: MeshStandardMaterial;
  } & ThreeElements["mesh"]) => (
    <mesh {...props} material={material} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
  return (
    <group scale={era === "classic" ? [0.92, 0.92, 0.86] : [1, 1, 1]}>
      <mesh geometry={geo} material={mats.red} castShadow />
      <Box
        size={[3.6, 0.07, 1.5]}
        position={[0.12, 0.18, 0]}
        material={mats.black}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            geometry={pod}
            material={mats.red}
            position={[0, 0, side * 0.53]}
            castShadow
          />
          <Box
            size={[0.1, 0.3, 0.46]}
            position={[-0.33, 0.47, side * 0.55]}
            material={mats.black}
          />
          <Box
            size={[1.12, 0.025, 0.11]}
            position={[0.15, 0.67, side * 0.62]}
            material={mats.white}
          />
          {[-1.5, 1.43].map((x) => (
            <group key={x} position={[x, 0.47, side * 1.03]}>
              <mesh
                rotation={[Math.PI / 2, 0, 0]}
                material={mats.rubber}
                castShadow
              >
                <cylinderGeometry
                  args={[0.44, 0.44, x > 0 ? 0.49 : 0.38, 32]}
                />
              </mesh>
              <mesh
                position={[0, 0, side * 0.251]}
                rotation={[Math.PI / 2, 0, 0]}
                material={mats.black}
              >
                <cylinderGeometry args={[0.255, 0.255, 0.015, 24]} />
              </mesh>
              <mesh
                position={[0, 0, side * 0.265]}
                rotation={[Math.PI / 2, 0, 0]}
                material={mats.metal}
              >
                <cylinderGeometry args={[0.078, 0.078, 0.04, 16]} />
              </mesh>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Box
                  key={i}
                  size={[0.036, 0.41, 0.016]}
                  position={[0, 0, side * 0.266]}
                  rotation={[0, 0, (i * Math.PI) / 4]}
                  material={mats.metal}
                />
              ))}
              <mesh position={[0, 0, side * 0.27]} material={mats.white}>
                <torusGeometry args={[0.362, 0.007, 4, 40]} />
              </mesh>
            </group>
          ))}
          {[-1.5, 1.43].map((x) => (
            <group key={x}>
              <Rod
                a={[x - 0.35, 0.34, side * 0.18]}
                b={[x, 0.43, side * 1.02]}
                material={mats.black}
              />
              <Rod
                a={[x + 0.35, 0.33, side * 0.18]}
                b={[x, 0.43, side * 1.02]}
                material={mats.black}
              />
              <Rod
                a={[x + 0.2, 0.65, side * 0.18]}
                b={[x, 0.43, side * 1.02]}
                material={mats.black}
              />
            </group>
          ))}
          <Box
            size={[0.43, 0.22, 0.04]}
            position={[-2.25, 0.38, side * 1.02]}
          />
          <Box
            size={[0.66, 0.57, 0.045]}
            position={[1.94, 1.05, side * 0.81]}
          />
          <Rod
            a={[-0.65, 0.65, side * 0.3]}
            b={[-0.65, 0.83, side * 0.57]}
            material={mats.black}
          />
          <Box size={[0.18, 0.1, 0.22]} position={[-0.65, 0.83, side * 0.57]} />
        </group>
      ))}
      <Box
        size={[0.48, 0.065, 2.03]}
        position={[-2.25, 0.26, 0]}
        rotation={[0, 0, -0.12]}
        material={mats.black}
      />
      <Box
        size={[0.18, 0.045, 1.96]}
        position={[-2.07, 0.38, 0]}
        rotation={[0, 0, -0.15]}
      />
      <Box
        size={[0.5, 0.065, 1.64]}
        position={[1.91, 1.26, 0]}
        rotation={[0, 0, 0.12]}
      />
      <Box
        size={[0.24, 0.08, 1.64]}
        position={[2.1, 1.37, 0]}
        rotation={[0, 0, 0.25]}
        material={mats.white}
      />
      <Box
        size={[0.12, 0.76, 0.07]}
        position={[1.88, 0.68, 0.4]}
        material={mats.black}
      />
      <Box
        size={[0.12, 0.76, 0.07]}
        position={[1.88, 0.68, -0.4]}
        material={mats.black}
      />
      <mesh
        position={[-0.35, 0.845, 0]}
        rotation={[0, 0, -0.05]}
        scale={[0.49, 0.055, 0.245]}
        material={mats.black}
      >
        <sphereGeometry args={[1, 24, 12]} />
      </mesh>
      <mesh
        position={[-0.25, 0.865, 0]}
        scale={[0.22, 0.1, 0.16]}
        material={mats.black}
      >
        <sphereGeometry args={[1, 16, 8]} />
      </mesh>
      <mesh
        position={[-0.66, 0.855, 0]}
        rotation={[0, Math.PI / 2, 0.3]}
        material={mats.black}
      >
        <torusGeometry args={[0.13, 0.025, 8, 20]} />
      </mesh>
      <Box
        size={[0.4, 0.065, 0.2]}
        position={[-1.3, 0.77, 0]}
        rotation={[0, 0, 0.1]}
        material={mats.white}
      />
      <Box
        size={[0.5, 0.035, 1.22]}
        position={[1.78, 0.23, 0]}
        rotation={[0, 0, 0.16]}
        material={mats.black}
      />
      {era === "classic" && (
        <Box size={[0.34, 0.45, 0.3]} position={[0.28, 1.01, 0]} />
      )}
      {era === "modern" && (
        <group>
          <Rod
            a={[-0.65, 0.9, 0]}
            b={[-0.56, 1.15, 0]}
            material={mats.black}
            radius={0.035}
          />
          <Rod
            a={[-0.56, 1.15, 0]}
            b={[0.1, 1.06, 0.3]}
            material={mats.black}
            radius={0.035}
          />
          <Rod
            a={[-0.56, 1.15, 0]}
            b={[0.1, 1.06, -0.3]}
            material={mats.black}
            radius={0.035}
          />
        </group>
      )}
    </group>
  );
}
