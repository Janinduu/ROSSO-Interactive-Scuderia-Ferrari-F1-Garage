import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(
    require,
    module,
    module.exports,
  );
  return module.exports;
}
const { families, specForYear } = load("../src/3d/cars/families.ts");
const { loft, floorPanel, aerofoil } = load("../src/3d/cars/geometry.ts");
const { EXPLODE, groupProgress } = load("../src/3d/cars/explode.ts");
test("All era bodywork has finite positions and normals after smoothing", () => {
  for (const spec of Object.values(families))
    for (const rings of [spec.tub, spec.cover].filter(Boolean)) {
      const g = loft(rings);
      for (const attr of ["position", "normal"])
        assert.ok(
          Array.from(g.attributes[attr].array).every(Number.isFinite),
          spec.family,
        );
      g.computeBoundingBox();
      assert.ok(g.boundingBox.max.x > g.boundingBox.min.x);
      g.dispose();
    }
});
test("Floor geometry remains above the plinth and wing spans retain their authored width", () => {
  for (const spec of Object.values(families)) {
    if (spec.floor) {
      const f = spec.floor;
      const g = floorPanel(f.x0, f.x1, f.w);
      g.computeBoundingBox();
      assert.ok(g.boundingBox.min.y > 0);
      assert.ok(Math.abs(g.boundingBox.max.z - f.w) < 1e-5);
      g.dispose();
    }
    if (spec.frontWing) {
      const w = spec.frontWing;
      const g = aerofoil(w.chord, w.span);
      g.computeBoundingBox();
      assert.ok(
        Math.abs(g.boundingBox.max.z - g.boundingBox.min.z - w.span) < 1e-5,
      );
      g.dispose();
    }
  }
});
test("Engineering separation is reversible and never overshoots", () => {
  for (const name of Object.keys(EXPLODE)) {
    assert.equal(groupProgress(name, 0), 0);
    assert.equal(groupProgress(name, 1), 1);
    let last = 0;
    for (let i = 0; i <= 100; i++) {
      const p = groupProgress(name, i / 100);
      assert.ok(p >= last && p <= 1);
      last = p;
    }
  }
});
test("Engine architecture changes at the V10, V8 and hybrid boundaries", () => {
  for (const [year, family, count] of [
    [1951, "front50s", 12],
    [1952, "front50s", 4],
    [1975, "wing70s", 12],
    [2004, "v10", 10],
    [2006, "v10", 8],
    [2013, "hybrid14", 8],
    [2014, "hybrid14", 6],
  ])
    assert.equal(specForYear(family, year).engineCylinders, count);
});
