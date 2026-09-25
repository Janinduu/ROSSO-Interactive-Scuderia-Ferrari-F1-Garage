import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Pause, Play, RotateCcw, X } from "lucide-react";
import { COL, atDistance, atTime, deltaTrace, fmtLap, labIds, labMeta, loadLab, miniSectors } from "./labData";
import type { LabSession } from "./labData";
import { DRIVER_COLOURS, drawTrack, drawTraces } from "./labCanvas";
import ShowCard, { normalise } from "../moments/ShowCard";
import type { Channel } from "./labCanvas";
import { playEngine, setEngineRpm, stopEngine } from "../../audio/soundEngine";
import { engineProfile } from "../../audio/engineProfile";
import { useSoundStore } from "../../audio/soundStore";
import { useEscape } from "../../app/useEscape";

const CHANNELS: Channel[] = [
  { key: "speed", label: "Speed", unit: "km/h", min: 50, max: 360, height: 3 },
  { key: "throttle", label: "Throttle", unit: "%", min: 0, max: 100, height: 1.3 },
  { key: "brake", label: "Brake", unit: "on/off", min: 0, max: 1, height: 0.8 },
  { key: "gear", label: "Gear", unit: "", min: 1, max: 8, height: 1.2 },
  { key: "delta", label: "Gap", unit: "s", min: -0.6, max: 0.6, height: 1.5 },
];
const SPEEDS = [0.5, 1];

// The lab: pick a qualifying session, then compare the two Ferraris' fastest
// laps on a shared track map and stacked telemetry traces.
export default function RaceLab({ initial, onClose }: { initial: string | null; onClose: () => void }) {
  const [id, setId] = useState<string | null>(initial);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    stopEngine();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  useEscape(() => (id ? setId(null) : onClose()));
  return (
    <div className="theatre lab" role="dialog" aria-modal="true" aria-label="Race Lab">
      {id ? <Lab key={id} id={id} onBack={() => setId(null)} /> : <Picker onPick={setId} onClose={onClose} />}
    </div>
  );
}

function Picker({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const [sessions, setSessions] = useState<Record<string, LabSession>>({});
  useEffect(() => {
    let live = true;
    Promise.all(labIds.map(loadLab)).then((all) => live && setSessions(Object.fromEntries(all.map((s) => [s.id, s]))));
    return () => {
      live = false;
    };
  }, []);
  return (
    <div className="theatre-gallery">
      <button className="icon-button theatre-close" onClick={onClose} aria-label="Close Race Lab">
        <X size={20} />
      </button>
      <div className="eyebrow">
        <span className="tiny-line" />
        RACE LAB · MEASURED TELEMETRY
      </div>
      <h1>
        Two Ferraris.
        <strong>One lap each.</strong>
      </h1>
      <p className="theatre-intro">
        Speed, throttle, brakes and gears from each driver's fastest qualifying
        lap, recorded by the car and published by OpenF1. Choose a session and see
        where the time was won.
      </p>
      {labIds.length === 0 && <p className="fine-print">Telemetry is still being imported.</p>}
      <div className="theatre-grid">
        {labIds.map((sid) => {
          const s = sessions[sid];
          const [a, b] = s?.drivers ?? [];
          return (
            <ShowCard
              key={sid}
              tone="gold"
              track={s ? trackOf(s) : null}
              year={s?.year ?? sid.slice(-4)}
              chip={labMeta[sid]?.chip}
              kicker={`${labMeta[sid]?.circuit ?? ""} · Qualifying`}
              title={labMeta[sid]?.title ?? sid}
              story={labMeta[sid]?.story}
              meta={
                a && b ? (
                  <>
                    <b>{a.code}</b> {fmtLap(a.lapTime)} · <b>{b.code}</b> +{(b.lapTime - a.lapTime).toFixed(3)}
                  </>
                ) : null
              }
              action="Compare the laps"
              onClick={() => onPick(sid)}
            />
          );
        })}
      </div>
    </div>
  );
}

/** The fastest lap's own x/y positions as a thumbnail outline. */
function trackOf(session: LabSession): [number, number][] {
  const s = session.drivers[0].samples;
  // OpenF1 y grows upwards; flip it for the screen.
  return normalise(s.filter((_, i) => i % 4 === 0).map((p) => [p[COL.x], -p[COL.y]]));
}

function Lab({ id, onBack }: { id: string; onBack: () => void }) {
  const [session, setSession] = useState<LabSession | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(0.5);
  const [t, setT] = useState(0);
  const track = useRef<HTMLCanvasElement>(null);
  const traces = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);

  useEffect(() => {
    let live = true;
    loadLab(id).then((s) => live && setSession(s));
    return () => {
      live = false;
    };
  }, [id]);
  const pair = session?.drivers.slice(0, 2) ?? [];
  const [a, b] = pair;
  const sectors = useMemo(() => (a && b ? miniSectors(a, b) : []), [a, b]);
  const delta = useMemo(() => (a && b ? deltaTrace(a, b) : []), [a, b]);
  const lapMs = a ? a.samples.at(-1)![COL.t] : 1;
  const soundOn = useSoundStore((s) => s.enabled);

  // While the laps play, the engine note follows the faster car's recorded rpm.
  useEffect(() => {
    if (!playing || !soundOn || !session) return;
    // Every lab session is from the V6 turbo-hybrid era; the year picks the voice.
    playEngine(engineProfile(null, session.year), undefined, { live: true });
    return () => stopEngine();
  }, [playing, soundOn, session]);
  useEffect(() => {
    if (playing && a) setEngineRpm(atTime(a, t)[COL.rpm]);
  }, [playing, a, t]);

  // Ghost playback: both laps advance on the same clock.
  useEffect(() => {
    if (!playing || !a) return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      tRef.current = Math.min(lapMs, tRef.current + (now - last) * speed);
      last = now;
      setT(tRef.current);
      if (tRef.current >= lapMs) setPlaying(false);
      else frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, a, lapMs]);

  // Repaint on every change of the cursor or size.
  useEffect(() => {
    if (!a || !b || !track.current || !traces.current) return;
    const paint = () => {
      drawTrack(track.current!, pair, sectors, t);
      drawTraces(traces.current!, pair, CHANNELS, delta, atTime(a, t)[COL.d]);
    };
    paint();
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [a, b, pair, sectors, delta, t]);

  if (!session || !a || !b)
    return (
      <div className="replay-loading">
        <span />
        Loading telemetry…
      </div>
    );

  const now = [atTime(a, t), atTime(b, t)];
  const here = now[0][COL.d];
  const gap = (atDistance(b, here)[COL.t] - atDistance(a, here)[COL.t]) / 1000;
  const scrub = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    // The stage may be scaled: convert the trace margins (layout px) to screen px.
    const k = r.width / e.currentTarget.clientWidth;
    const left = 64 * k;
    const frac = Math.max(0, Math.min(1, (e.clientX - r.left - left) / (r.width - left - 14 * k)));
    const len = Math.min(a.length, b.length);
    tRef.current = atDistance(a, frac * len)[COL.t];
    setT(tRef.current);
  };
  const aWins = sectors.filter((s) => s.faster === 0).length;
  const top = (d: typeof a) => Math.max(...d.samples.map((s) => s[COL.speed]));

  return (
    <div className="lab-view">
      <header className="lab-head">
        <div>
          <span className="eyebrow">
            <span className="tiny-line" />
            RACE LAB · {session.year} {session.country.toUpperCase()} · {session.session.toUpperCase()}
          </span>
          <h1>{labMeta[id]?.title ?? id}</h1>
        </div>
        <div className="lab-drivers">
          {pair.map((d, i) => (
            <div key={d.number} className="lab-driver" style={{ ["--c" as string]: DRIVER_COLOURS[i] }}>
              <span className="lab-code">
                {d.code} <em>#{d.number}</em>
              </span>
              <strong>{fmtLap(d.lapTime)}</strong>
              <span>
                {i === 0 ? "Fastest Ferrari" : `+${(d.lapTime - a.lapTime).toFixed(3)} s`}
                {d.position ? ` · qualified P${d.position}` : ""}
              </span>
            </div>
          ))}
        </div>
        <button className="icon-button" onClick={onBack} aria-label="Back to sessions">
          <X size={18} />
        </button>
      </header>

      <div className="lab-body">
        <div className="lab-map">
          <canvas ref={track} aria-label="Track map coloured by faster driver in each mini-sector" />
          <div className="lab-legend">
            {pair.map((d, i) => (
              <span key={d.number}>
                <i style={{ background: DRIVER_COLOURS[i] }} /> {d.code} faster ({i === 0 ? aWins : sectors.length - aWins}/
                {sectors.length})
              </span>
            ))}
          </div>
          <div className="lab-readout" aria-live="off">
            {pair.map((d, i) => (
              <div key={d.number} style={{ ["--c" as string]: DRIVER_COLOURS[i] }}>
                <span className="lab-code">{d.code}</span>
                <b>{Math.round(now[i][COL.speed])}</b>
                <small>km/h</small>
                <b>{Math.round(now[i][COL.gear])}</b>
                <small>gear</small>
                <span className="lab-bar">
                  <i style={{ width: `${now[i][COL.throttle]}%` }} />
                </span>
                <span className={`lab-brake ${now[i][COL.brake] > 0.5 ? "on" : ""}`}>BRAKE</span>
              </div>
            ))}
            <p>
              Gap at {Math.round(here)} m:{" "}
              <strong>
                {b.code} {gap >= 0 ? "+" : "−"}
                {Math.abs(gap).toFixed(3)} s
              </strong>
            </p>
          </div>
        </div>
        <div className="lab-traces">
          <canvas ref={traces} onMouseDown={scrub} onMouseMove={(e) => e.buttons === 1 && scrub(e)} aria-label="Telemetry traces against distance" />
        </div>
      </div>

      <footer className="lab-controls">
        <button className="icon-button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play the laps"}>
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <button
          className="icon-button"
          onClick={() => {
            tRef.current = 0;
            setT(0);
            setPlaying(true);
          }}
          aria-label="Restart"
        >
          <RotateCcw size={16} />
        </button>
        <span className="lab-clock">{fmtLap(t / 1000)}</span>
        <input
          type="range"
          min={0}
          max={lapMs}
          value={t}
          aria-label="Lap time"
          onChange={(e) => {
            tRef.current = Number(e.target.value);
            setT(tRef.current);
          }}
        />
        <div className="replay-seg" role="group" aria-label="Speed">
          {SPEEDS.map((s) => (
            <button key={s} aria-pressed={speed === s} onClick={() => setSpeed(s)}>
              {s}×
            </button>
          ))}
        </div>
        <span className="lab-top">
          Top speed {a.code} {top(a)} · {b.code} {top(b)} km/h
        </span>
        <p className="lab-credit">
          Measured telemetry ·{" "}
          <a href={session.source} target="_blank" rel="noreferrer">
            OpenF1 <ExternalLink size={10} />
          </a>{" "}
          · about 4 samples a second, interpolated · distance from integrated speed
        </p>
      </footer>
    </div>
  );
}
