// Offline, reproducible editorial import. No API requests are made by visitors.
import { writeFile, mkdir } from "node:fs/promises";
// Results are imported up to this date. Update it deliberately, together with
// the UI note, tests and README, when refreshing the snapshot.
const CUTOFF = process.env.ROSSO_CUTOFF ?? "2026-09-25";
const ids = [
  "ascari",
  "fangio",
  "hawthorn",
  "phil_hill",
  "surtees",
  "lauda",
  "gilles_villeneuve",
  "scheckter",
  "mansell",
  "prost",
  "michael_schumacher",
  "raikkonen",
  "alonso",
  "vettel",
  "sainz",
  "leclerc",
  "hamilton",
];
const history = {};
for (const id of ids) {
  const races = [];
  let offset = 0;
  let total = 1;
  while (offset < total) {
    const url = `https://api.jolpi.ca/ergast/f1/drivers/${id}/constructors/ferrari/results/?limit=100&offset=${offset}`;
    let json;
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(url, {
        headers: { "User-Agent": "RossoFanArchive/1.0 (github.com/Janinduu)" },
      });
      if (res.ok) {
        json = await res.json();
        break;
      }
      if (res.status !== 429 && res.status < 500)
        throw new Error(`${res.status}: ${url}`);
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
    if (!json) throw new Error(`Import failed: ${id}`);
    total = Number(json.MRData.total);
    races.push(...json.MRData.RaceTable.Races);
    offset += Number(json.MRData.limit);
    await new Promise((r) => setTimeout(r, 400));
  }
  const seasons = {};
  for (const race of races.filter((r) => r.date <= CUTOFF)) {
    const y = race.season;
    seasons[y] ??= {
      year: Number(y),
      entries: 0,
      wins: 0,
      podiums: 0,
      races: [],
    };
    seasons[y].entries++;
    const best = race.Results.reduce((a, b) =>
      Number(a.position) < Number(b.position) ? a : b,
    );
    if (Number(best.position) === 1) seasons[y].wins++;
    if (Number(best.position) <= 3) seasons[y].podiums++;
    seasons[y].races.push({
      name: race.raceName,
      position: best.positionText,
      date: race.date,
    });
  }
  history[id] = {
    source: `https://api.jolpi.ca/ergast/f1/drivers/${id}/constructors/ferrari/results/`,
    cutoff: CUTOFF,
    seasons: Object.values(seasons),
  };
  console.log(
    `${id}: ${Object.values(seasons).reduce((n, s) => n + s.entries, 0)} GP entries`,
  );
}
await mkdir("src/data", { recursive: true });
await writeFile(
  "src/data/history.json",
  JSON.stringify(history, null, 2) + "\n",
);
