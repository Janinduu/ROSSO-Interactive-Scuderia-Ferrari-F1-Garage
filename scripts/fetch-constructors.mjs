// Offline import of Ferrari's constructors' championship record from Jolpica.
// Writes src/data/constructors.json; visitors never call the API.
import { writeFile } from "node:fs/promises";

const CUTOFF_YEAR = Number(process.env.ROSSO_CUTOFF_YEAR ?? 2026);
const API = "https://api.jolpi.ca/ergast/f1";
const headers = { "User-Agent": "RossoFanArchive/1.0 (github.com/Janinduu)" };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.json();
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status}: ${url}`);
    await pause(3000 * (attempt + 1));
  }
  throw new Error(`Failed: ${url}`);
}

// The constructors' championship began in 1958. Jolpica serves standings one
// season at a time.
const seasons = [];
for (let year = 1958; year <= CUTOFF_YEAR; year++) {
  const json = await get(`${API}/${year}/constructors/ferrari/constructorStandings/`);
  const list = json.MRData.StandingsTable.StandingsLists[0];
  const s = list?.ConstructorStandings[0];
  if (s)
    seasons.push({
      year,
      position: Number(s.position),
      points: Number(s.points),
      wins: Number(s.wins),
      round: Number(list.round),
    });
  await pause(350);
}
seasons.sort((a, b) => a.year - b.year);

// The drivers who raced for Ferrari in each title year.
const titles = [];
for (const s of seasons.filter((x) => x.position === 1)) {
  const json = await get(`${API}/${s.year}/constructors/ferrari/drivers/?limit=100`);
  const drivers = json.MRData.DriverTable.Drivers.map((d) => ({
    id: d.driverId,
    name: `${d.givenName} ${d.familyName}`,
  }));
  titles.push({ ...s, drivers });
  console.log(`${s.year}: P1, ${s.points} pts, ${s.wins} wins, ${drivers.length} drivers`);
  await pause(400);
}

await writeFile(
  "src/data/constructors.json",
  JSON.stringify(
    {
      source: `${API}/{year}/constructors/ferrari/constructorStandings/`,
      driversSource: `${API}/{year}/constructors/ferrari/drivers/`,
      cutoffYear: CUTOFF_YEAR,
      seasons,
      titles,
    },
    null,
    2,
  ) + "\n",
);
console.log(`${seasons.length} seasons, ${titles.length} constructors' titles`);
