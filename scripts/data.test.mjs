import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const data = JSON.parse(
  await readFile(new URL("../src/data/history.json", import.meta.url)),
);
const total = (id, key) => data[id].seasons.reduce((n, s) => n + s[key], 0);
const CUTOFF = "2026-09-25";
const stats = JSON.parse(
  await readFile(new URL("../src/data/careerStats.json", import.meta.url)),
);
test("Ferrari-only aggregates reconcile with the independently published core exhibits", () => {
  for (const [id, wins, podiums] of [
    ["michael_schumacher", 72, 116],
    ["lauda", 15, 32],
    ["vettel", 14, 55],
    ["gilles_villeneuve", 6, 13],
  ]) {
    assert.equal(total(id, "wins"), wins, id + " wins");
    assert.equal(total(id, "podiums"), podiums, id + " podiums");
  }
});
test("The complete 17-driver archive is populated and frozen at the declared cutoff", () => {
  assert.equal(Object.keys(data).length, 17);
  for (const [id, d] of Object.entries(data)) {
    assert.ok(d.seasons.length > 0, id);
    assert.equal(d.cutoff, CUTOFF);
    assert.ok(
      d.source.includes(`/drivers/${id}/constructors/ferrari/results/`),
    );
    assert.deepEqual(
      d.seasons.map((s) => s.year),
      d.seasons.map((s) => s.year).sort((a, b) => a - b),
    );
    for (const s of d.seasons) {
      assert.ok(s.races.every((r) => r.date <= CUTOFF));
      assert.ok(s.races.length > 0);
      assert.equal(s.entries, s.races.length);
      assert.equal(s.wins, s.races.filter((r) => r.position === "1").length);
      assert.equal(
        s.podiums,
        s.races.filter((r) => ["1", "2", "3"].includes(r.position)).length,
      );
      assert.equal(
        new Set(s.races.map((r) => r.date + r.name)).size,
        s.races.length,
        "Shared drives must count once",
      );
    }
  }
});
test("Schumacher season results and interrupted Ferrari careers retain historical boundaries", () => {
  const michael = data.michael_schumacher.seasons;
  assert.equal(michael.length, 11);
  assert.equal(michael.find((s) => s.year === 2000).wins, 9);
  assert.equal(michael.find((s) => s.year === 2002).podiums, 17);
  assert.equal(michael.find((s) => s.year === 2004).wins, 13);
  assert.deepEqual(
    data.raikkonen.seasons.map((s) => s.year),
    [2007, 2008, 2009, 2014, 2015, 2016, 2017, 2018],
  );
  assert.equal(data.ascari.seasons.at(-1).year, 1954);
});
test("Present-day data counts Grand Prix results only, never sprints or other teams", () => {
  const season = (id, y) => data[id].seasons.find((s) => s.year === y);
  assert.deepEqual(
    data.hamilton.seasons.map((s) => s.year),
    [2025, 2026],
  );
  // The 2025 China sprint win must not appear as a Grand Prix win.
  assert.equal(season("hamilton", 2025).wins, 0);
  // First Grand Prix win for Ferrari: Barcelona, 14 June 2026.
  const firstWin = data.hamilton.seasons
    .flatMap((s) => s.races)
    .find((r) => r.position === "1");
  assert.equal(firstWin.date, "2026-06-14");
  assert.equal(
    data.leclerc.seasons
      .filter((s) => s.year <= 2025)
      .reduce((n, s) => n + s.wins, 0),
    8,
  );
});

test("Career stats cover all 17 drivers and agree with the Ferrari record", () => {
  assert.equal(Object.keys(stats.drivers).length, 17);
  const ferrariTitles = {
    ascari: [1952, 1953], fangio: [1956], hawthorn: [1958], phil_hill: [1961],
    surtees: [1964], lauda: [1975, 1977], scheckter: [1979],
    michael_schumacher: [2000, 2001, 2002, 2003, 2004], raikkonen: [2007],
  };
  for (const [id, s] of Object.entries(stats.drivers)) {
    const ferrari = (s.careerTitles ?? [])
      .filter((t) => t.team === "Ferrari")
      .map((t) => t.year);
    assert.deepEqual(ferrari, ferrariTitles[id] ?? [], id + " Ferrari titles");
    assert.ok(Number.isInteger(s.polesWithFerrari), id + " poles");
    for (const src of s.sourceIds ?? []) assert.ok(stats.sources[src], id + " source " + src);
  }
  assert.equal(stats.drivers.michael_schumacher.polesWithFerrari, 58);
  assert.equal(stats.drivers.hamilton.careerTitles.length, 7);
});
