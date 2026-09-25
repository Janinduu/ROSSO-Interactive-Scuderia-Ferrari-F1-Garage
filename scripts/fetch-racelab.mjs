// Offline import for the Race Lab: the two Ferrari drivers' fastest laps in
// selected qualifying sessions, with car telemetry and track position from
// OpenF1 (https://openf1.org). Visitors never call the API.
//
// OpenF1 restricts all access while a live F1 session is running; this script
// waits and retries until the session ends.
import { access, mkdir, writeFile } from "node:fs/promises";

const API = "https://api.openf1.org/v1";
const headers = { "User-Agent": "RossoFanArchive/1.0 (github.com/Janinduu)" };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const sessions = [
  { id: "singapore-2023", year: 2023, match: { country_name: "Singapore" } },
  { id: "monaco-2024", year: 2024, match: { country_name: "Monaco" } },
  { id: "monza-2024", year: 2024, match: { circuit_short_name: "Monza" } },
  { id: "hungary-2025", year: 2025, match: { country_name: "Hungary" } },
  { id: "barcelona-2026", year: 2026, match: { circuit_short_name: "Catalunya" } },
  { id: "silverstone-2026", year: 2026, match: { country_name: "United Kingdom" } },
];

async function get(path) {
  const url = `${API}/${path}`;
  for (let attempt = 0; attempt < 60; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.json();
    const body = await res.text();
    if (/live f1 session in progress/i.test(body)) {
      console.log("  OpenF1 is locked during a live session; retrying in 5 minutes…");
      await pause(5 * 60_000);
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      await pause(4000 * (attempt + 1));
      continue;
    }
    throw new Error(`${res.status}: ${url}\n${body.slice(0, 200)}`);
  }
  throw new Error(`Gave up: ${url}`);
}

const iso = (ms) => new Date(ms).toISOString();

/**
 * One lap's telemetry as a function of lap fraction. Distance comes from
 * integrating speed; the lap is anchored exactly at its start and end times,
 * so the part before the first in-lap sample is not lost.
 */
function lapTrace(car, loc, startMs, lapMs) {
  const pts = car
    .map((c) => ({ t: Date.parse(c.date) - startMs, ...c }))
    .sort((a, b) => a.t - b.t);
  let d = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) d += (((pts[i].speed + pts[i - 1].speed) / 2) / 3.6) * ((pts[i].t - pts[i - 1].t) / 1000);
    pts[i].d = d;
  }
  const locs = loc.map((l) => ({ t: Date.parse(l.date) - startMs, x: l.x, y: l.y })).sort((a, b) => a.t - b.t);
  const at = (arr, key, v) => {
    let i = arr.findIndex((p) => p[key] >= v);
    if (i <= 0) return i === 0 ? { a: arr[0], b: arr[0], k: 0 } : { a: arr.at(-1), b: arr.at(-1), k: 0 };
    const a = arr[i - 1];
    const b = arr[i];
    return { a, b, k: (v - a[key]) / (b[key] - a[key] || 1) };
  };
  const dAt = (t) => {
    const { a, b, k } = at(pts, "t", t);
    return a.d + (b.d - a.d) * k;
  };
  const d0 = dAt(0);
  const d1 = dAt(lapMs);
  return {
    length: d1 - d0,
    /** The row at a fraction of the lap, with distance on a shared scale. */
    row(fraction, refLength) {
      const { a, b, k } = at(pts, "d", d0 + fraction * (d1 - d0));
      const t = Math.min(lapMs, Math.max(0, a.t + (b.t - a.t) * k));
      const near = k < 0.5 ? a : b;
      const l = at(locs, "t", t);
      return [
        Math.round(fraction * refLength),
        Math.round(t),
        Math.round(a.speed + (b.speed - a.speed) * k),
        Math.round(a.throttle + (b.throttle - a.throttle) * k),
        near.brake > 0 ? 1 : 0,
        near.n_gear,
        Math.round(a.rpm + (b.rpm - a.rpm) * k),
        Math.round(l.a.x + (l.b.x - l.a.x) * l.k),
        Math.round(l.a.y + (l.b.y - l.a.y) * l.k),
      ];
    },
  };
}

await mkdir("src/data/racelab", { recursive: true });
for (const s of sessions) {
  const file = `src/data/racelab/${s.id}.json`;
  if (!process.env.FORCE && (await access(file).then(() => true, () => false))) continue;
  const all = await get(`sessions?year=${s.year}&session_name=Qualifying`);
  const session = all.find((x) => Object.entries(s.match).every(([k, v]) => x[k] === v));
  if (!session) {
    console.log(`${s.id}: no qualifying session found, skipped`);
    continue;
  }
  const key = session.session_key;
  await pause(400);
  const drivers = (await get(`drivers?session_key=${key}`)).filter((d) => /ferrari/i.test(d.team_name ?? ""));
  const results = await get(`session_result?session_key=${key}`).catch(() => []);
  const entries = [];
  for (const d of drivers) {
    await pause(400);
    const laps = (await get(`laps?session_key=${key}&driver_number=${d.driver_number}`)).filter(
      (l) => l.lap_duration && !l.is_pit_out_lap,
    );
    if (!laps.length) continue;
    const best = laps.reduce((a, b) => (b.lap_duration < a.lap_duration ? b : a));
    const start = Date.parse(best.date_start);
    const end = start + best.lap_duration * 1000;
    const window = `date>=${iso(start - 1500)}&date<=${iso(end + 1500)}`;
    await pause(400);
    const car = await get(`car_data?session_key=${key}&driver_number=${d.driver_number}&${window}`);
    await pause(400);
    const loc = await get(`location?session_key=${key}&driver_number=${d.driver_number}&${window}`);
    const trace = lapTrace(car, loc, start, best.lap_duration * 1000);
    const result = Array.isArray(results) ? results.find((r) => r.driver_number === d.driver_number) : null;
    entries.push({
      number: d.driver_number,
      code: d.name_acronym,
      name: d.full_name,
      colour: d.team_colour,
      lapTime: best.lap_duration,
      lapNumber: best.lap_number,
      sectors: [best.duration_sector_1, best.duration_sector_2, best.duration_sector_3],
      speedTrap: best.st_speed ?? null,
      position: result?.position ?? null,
      trace,
    });
  }
  entries.sort((a, b) => a.lapTime - b.lapTime);
  // Integrated distance drifts by about 1% differently for each car. Both laps
  // are mapped onto one shared length so a metre means the same place on track.
  const refLength = entries.reduce((n, e) => n + e.trace.length, 0) / entries.length;
  const rows = Math.round(refLength / 8);
  for (const e of entries) {
    e.rawLength = Math.round(e.trace.length);
    e.length = Math.round(refLength);
    e.samples = Array.from({ length: rows + 1 }, (_, i) => e.trace.row(i / rows, refLength));
    delete e.trace;
  }
  await writeFile(
    file,
    JSON.stringify({
      id: s.id,
      year: s.year,
      sessionKey: key,
      session: session.session_name,
      circuit: session.circuit_short_name,
      country: session.country_name,
      location: session.location,
      date: session.date_start.slice(0, 10),
      columns: ["distance_m", "time_ms", "speed_kph", "throttle_pct", "brake", "gear", "rpm", "x", "y"],
      drivers: entries,
      source: `${API}/car_data?session_key=${key}`,
    }) + "\n",
  );
  console.log(`${s.id}: ${entries.map((e) => `${e.code} ${e.lapTime.toFixed(3)} (${e.samples.length} pts)`).join(" · ")}`);
}
