// Offline import for the Legendary Moments replays. For each race it bundles
// the classification, every driver's cumulative time at the end of each lap
// (Jolpica), and a simplified circuit outline (bacinger/f1-circuits, MIT).
// Visitors never call either service.
import { access, mkdir, writeFile } from "node:fs/promises";

const races = [
  { id: "spain-1996", season: 1996, round: 7, circuit: "es-1991" },
  { id: "japan-2000", season: 2000, round: 16, circuit: "jp-1962" },
  { id: "france-2004", season: 2004, round: 10, circuit: "fr-1960" },
  { id: "brazil-2007", season: 2007, round: 17, circuit: "br-1940" },
  { id: "italy-2019", season: 2019, round: 14, circuit: "it-1922" },
  { id: "barcelona-2026", season: 2026, round: 7, circuit: "es-1991" },
];
const API = "https://api.jolpi.ca/ergast/f1";
const CIRCUITS = "https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits";
const headers = { "User-Agent": "RossoFanArchive/1.0 (github.com/Janinduu)" };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, json = true) {
  for (let attempt = 0; attempt < 7; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return json ? res.json() : res.text();
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status}: ${url}`);
    await pause(5000 * (attempt + 1));
  }
  throw new Error(`Failed: ${url}`);
}

const toMs = (t) => {
  const [m, s] = t.includes(":") ? t.split(":") : ["0", t];
  return Math.round((Number(m) * 60 + Number(s)) * 1000);
};

/** Project lon/lat to a 0..1 box and thin the line to roughly `max` points. */
function outline(geojson, max = 420) {
  const coords = geojson.features[0].geometry.coordinates;
  const lat0 = coords.reduce((a, c) => a + c[1], 0) / coords.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  let pts = coords.map(([lon, lat]) => [lon * k, -lat]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  const size = Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0);
  pts = pts.map(([x, y]) => [(x - x0) / size, (y - y0) / size]);
  const step = Math.max(1, Math.floor(pts.length / max));
  return pts
    .filter((_, i) => i % step === 0)
    .map(([x, y]) => [Number(x.toFixed(4)), Number(y.toFixed(4))]);
}

await mkdir("src/data/moments", { recursive: true });
for (const race of races) {
  // Resume-friendly: keep races already imported unless FORCE is set.
  const file = `src/data/moments/${race.id}.json`;
  if (!process.env.FORCE && (await access(file).then(() => true, () => false))) continue;
  const base = `${API}/${race.season}/${race.round}`;
  const result = (await get(`${base}/results/?limit=40`)).MRData.RaceTable.Races[0];
  await pause(400);
  // Laps come paged; gather every timing.
  const timings = {};
  let offset = 0;
  let total = 1;
  while (offset < total) {
    const json = await get(`${base}/laps/?limit=100&offset=${offset}`);
    total = Number(json.MRData.total);
    for (const lap of json.MRData.RaceTable.Races[0]?.Laps ?? [])
      for (const t of lap.Timings) (timings[t.driverId] ??= [])[Number(lap.number) - 1] = toMs(t.time);
    offset += Number(json.MRData.limit);
    await pause(350);
  }
  const drivers = result.Results.map((r) => {
    const laps = timings[r.Driver.driverId] ?? [];
    let sum = 0;
    const cumulative = [];
    for (const ms of laps) {
      if (ms == null) break;
      sum += ms;
      cumulative.push(sum);
    }
    return {
      id: r.Driver.driverId,
      code: r.Driver.code ?? r.Driver.familyName.slice(0, 3).toUpperCase(),
      name: `${r.Driver.givenName} ${r.Driver.familyName}`,
      team: r.Constructor.name,
      ferrari: r.Constructor.constructorId === "ferrari",
      number: r.number ? Number(r.number) : null,
      grid: Number(r.grid),
      finish: Number(r.position),
      status: r.status,
      cumulative,
    };
  });
  const geo = await get(`${CIRCUITS}/${race.circuit}.geojson`);
  const props = geo.features[0].properties;
  await writeFile(
    file,
    JSON.stringify({
      id: race.id,
      season: race.season,
      round: race.round,
      raceName: result.raceName,
      date: result.date,
      circuitName: props.Name,
      location: props.Location,
      laps: Math.max(...drivers.map((d) => d.cumulative.length)),
      drivers,
      track: outline(geo),
      sources: {
        results: `${base}/results/`,
        laps: `${base}/laps/`,
        circuit: `https://github.com/bacinger/f1-circuits/blob/master/circuits/${race.circuit}.geojson`,
      },
    }) + "\n",
  );
  const winner = drivers.find((d) => d.finish === 1);
  console.log(`${race.id}: ${result.raceName}, ${drivers.length} drivers, winner ${winner.name}, laps ${Math.max(...drivers.map((d) => d.cumulative.length))}`);
  await pause(500);
}
