import { useEffect, useMemo } from "react";
import type { Material } from "three";
import { tube } from "./geometry";
import type { CarSpec } from "./families";

type Metals = {
  engine: Material;
  carbon: Material;
  chrome: Material;
  paint: Material;
  dark: Material;
  brake: Material;
};
type V = [number, number, number];
function Pipe({
  points,
  radius,
  material,
}: {
  points: V[];
  radius: number;
  material: Material;
}) {
  const geometry = useMemo(() => tube(points, radius), [points, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} castShadow />;
}
function Block({ at, size, material }: { at: V; size: V; material: Material }) {
  return (
    <mesh position={at} material={material} castShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

/** Architectural study: cylinder count and bank layout follow the season;
 * accessory routing is illustrative, not a claim to factory CAD dimensions. */
export function Powertrain({ spec, mats }: { spec: CarSpec; mats: Metals }) {
  const flat = spec.family === "wing70s" && (spec.year ?? 1975) <= 1980;
  const hybrid = (spec.year ?? 2004) >= 2014;
  const cylinders = spec.engineCylinders ?? (flat ? 12 : hybrid ? 6 : 10);
  const rows = cylinders === 4 ? 1 : 2;
  const count = cylinders / rows;
  const start = spec.engineFront
    ? spec.frontAxle - 0.15
    : spec.cockpit.x1 + 0.22;
  const length = spec.engineFront
    ? 0.95
    : Math.min(0.95, spec.rearAxle - start - 0.12);
  const y = flat ? 0.29 : 0.36;
  const bank = flat ? 0.25 : 0.115;
  return (
    <group name="power_unit_proxy">
      <Block
        at={[start + length / 2, y, 0]}
        size={[length, 0.16, 0.22]}
        material={mats.engine}
      />
      {Array.from({ length: rows }, (_, r) => {
        const side = rows === 1 ? 0 : r * 2 - 1;
        return (
          <group key={r}>
            <Block
              at={[start + length / 2, y + 0.09, side * bank]}
              size={[length, 0.1, flat ? 0.21 : 0.14]}
              material={mats.paint}
            />
            {Array.from({ length: count }, (_, i) => {
              const x = start + ((i + 0.5) * length) / count;
              return (
                <group key={i}>
                  <mesh
                    position={[x, y + 0.18, side * bank]}
                    material={mats.chrome}
                  >
                    <cylinderGeometry
                      args={[0.038, 0.025, 0.13, 12, 1, true]}
                    />
                  </mesh>
                  <mesh
                    position={[x, y + 0.244, side * bank]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    material={mats.dark}
                  >
                    <circleGeometry args={[0.031, 12]} />
                  </mesh>
                  <Pipe
                    points={[
                      [x, y, side * (bank + 0.06)],
                      [x + 0.03, y - 0.08, side * (bank + 0.13)],
                      [start + length + 0.1, y - 0.07, side * 0.29],
                      [start + length + 0.3, y - 0.02, side * 0.22],
                    ]}
                    radius={0.018}
                    material={mats.chrome}
                  />
                  <mesh
                    position={[x, y + 0.147, side * (bank + 0.055)]}
                    material={mats.chrome}
                  >
                    <sphereGeometry args={[0.009, 6, 4]} />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}
      <Block
        at={[start + length + 0.16, y - 0.02, 0]}
        size={[flat ? 0.25 : 0.42, 0.21, flat ? 0.56 : 0.22]}
        material={mats.engine}
      />
      {Array.from({ length: 8 }, (_, i) => (
        <Block
          key={i}
          at={[start + length + 0.01 + i * 0.035, y + 0.09, 0]}
          size={[0.009, 0.035, flat ? 0.5 : 0.21]}
          material={mats.chrome}
        />
      ))}
      {hybrid && (
        <>
          <mesh
            position={[start + length, y + 0.16, 0]}
            rotation={[0, Math.PI / 2, 0]}
            material={mats.engine}
          >
            <torusGeometry args={[0.09, 0.037, 10, 24]} />
          </mesh>
          <Pipe
            points={[
              [start + length, y + 0.17, 0.06],
              [start + length - 0.2, y + 0.3, 0.18],
              [start + 0.15, y + 0.28, 0.16],
            ]}
            radius={0.045}
            material={mats.carbon}
          />
          <Pipe
            points={[
              [start + 0.2, y - 0.06, 0.16],
              [start + 0.1, y - 0.12, 0.24],
              [start + 0.55, y - 0.12, 0.25],
            ]}
            radius={0.011}
            material={mats.paint}
          />
        </>
      )}
      {spec.pods &&
        [-1, 1].map((side) => (
          <group
            key={side}
            position={[spec.pods!.x0 + 0.42, 0.3, side * spec.pods!.z]}
            rotation={[side * 0.22, 0, 0]}
          >
            <Block
              at={[0, 0, 0]}
              size={[0.55, 0.04, 0.24]}
              material={mats.engine}
            />
            {Array.from({ length: 18 }, (_, i) => (
              <Block
                key={i}
                at={[-0.26 + i * 0.03, 0.026, 0]}
                size={[0.009, 0.02, 0.23]}
                material={mats.chrome}
              />
            ))}
            <Pipe
              points={[
                [-0.23, 0, 0],
                [-0.29, -0.04, -side * 0.12],
                [-0.1, -0.04, -side * 0.3],
              ]}
              radius={0.025}
              material={mats.dark}
            />
          </group>
        ))}
    </group>
  );
}

export function SteeringDetail({
  modern,
  mats,
}: {
  modern: boolean;
  mats: Metals;
}) {
  return (
    <>
      <Block at={[0, 0, 0]} size={[0.22, 0.1, 0.025]} material={mats.carbon} />
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * 0.118, 0, 0]}
          scale={[0.55, 1, 1]}
          material={mats.dark}
        >
          <capsuleGeometry args={[0.032, 0.065, 4, 10]} />
        </mesh>
      ))}
      {modern && (
        <>
          <Block
            at={[0, 0.017, 0.015]}
            size={[0.085, 0.04, 0.003]}
            material={mats.chrome}
          />
          <Block
            at={[0, 0.017, 0.018]}
            size={[0.075, 0.029, 0.002]}
            material={mats.dark}
          />
        </>
      )}
      {[-1, 1].flatMap((s) =>
        [0, 1, 2].map((i) => (
          <mesh
            key={`${s}-${i}`}
            position={[s * (0.045 + i * 0.023), -0.025, 0.018]}
            rotation={[Math.PI / 2, 0, 0]}
            material={
              i === 0 ? mats.paint : i === 1 ? mats.chrome : mats.engine
            }
          >
            <cylinderGeometry args={[0.008, 0.008, 0.008, 10]} />
          </mesh>
        )),
      )}
      {[-1, 1].map((s) => (
        <Block
          key={s}
          at={[s * 0.075, 0, -0.025]}
          size={[0.028, 0.095, 0.006]}
          material={mats.engine}
        />
      ))}
    </>
  );
}
