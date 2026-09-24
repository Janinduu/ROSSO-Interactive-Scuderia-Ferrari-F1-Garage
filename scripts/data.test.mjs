import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const data = JSON.parse(
  await readFile(new URL("../src/data/history.json", import.meta.url)),
);
const total = (id, key) => data[id].seasons.reduce((n, s) => n + s[key], 0);
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
    assert.equal(d.cutoff, "2025-12-31");
    assert.ok(
      d.source.includes(`/drivers/${id}/constructors/ferrari/results/`),
    );
    assert.deepEqual(
      d.seasons.map((s) => s.year),
      d.seasons.map((s) => s.year).sort((a, b) => a - b),
    );
    for (const s of d.seasons) {
      assert.ok(s.year <= 2025);
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
test("Present-day snapshot does not mix Hamilton sprint wins or other-team titles into GP wins", () => {
  assert.deepEqual(
    data.hamilton.seasons.map((s) => s.year),
    [2025],
  );
  assert.equal(total("hamilton", "wins"), 0);
  assert.equal(total("leclerc", "wins"), 8);
});
