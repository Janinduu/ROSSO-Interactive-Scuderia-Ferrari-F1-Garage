import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ExternalLink, Pause, Play, RotateCcw, X } from "lucide-react";
import {
  gapToLeader,
  loadRace,
  momentList,
  momentSources,
  momentStory,
  raceDuration,
  raceState,
  timeAtLap,
  Track,
} from "./moments";
import type { MomentMeta, RaceData } from "./moments";
import { drawRace, lerpView, overview } from "./raceCanvas";
import type { View } from "./raceCanvas";
import { startMusic, stopMusic } from "../../audio/music";
import { stopEngine } from "../../audio/soundEngine";
import { drivers } from "../../data/drivers";

/** A full race plays in about 2.5 minutes at 1×. */
const PLAYBACK_MS = 150_000;
const SPEEDS = [1, 2, 4];
type CameraMode = "cinematic" | "overview" | "follow";

const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function titleOf(m: MomentMeta) {
  return momentStory(m.id)?.title ?? m.fallbackTitle;
}

// The theatre: a gallery of moments, then a full-screen replay.
export default function MomentsTheatre({
  initial,
  onClose,
  onVisitBay,
}: {
  initial: string | null;
  onClose: () => void;
  onVisitBay: (driverId: string, season: number) => void;
}) {
  const [active, setActive] = useState<string | null>(initial);
  // Lock page scroll; Esc steps back from a replay to the gallery, then closes.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    stopEngine();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (active) setActive(null);
      else onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [active, onClose]);
  useEffect(() => {
    startMusic("race");
    return () => stopMusic();
  }, []);

  return (
    <div className="theatre" role="dialog" aria-modal="true" aria-label="Legendary Moments">
      {active ? (
        <Replay
          key={active}
          meta={momentList.find((m) => m.id === active)!}
          onBack={() => setActive(null)}
          onVisitBay={onVisitBay}
        />
      ) : (
        <Gallery onPick={setActive} onClose={onClose} />
      )}
    </div>
  );
}

function Gallery({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const [tracks, setTracks] = useState<Record<string, RaceData>>({});
  useEffect(() => {
    let live = true;
    Promise.all(momentList.map((m) => loadRace(m.id))).then((all) => {
      if (live) setTracks(Object.fromEntries(all.map((r) => [r.id, r])));
    });
    return () => {
      live = false;
    };
  }, []);
  return (
    <div className="theatre-gallery">
      <button className="icon-button theatre-close" onClick={onClose} aria-label="Close Legendary Moments">
        <X size={20} />
      </button>
      <div className="eyebrow">
        <span className="tiny-line" />
        LEGENDARY MOMENTS
      </div>
      <h1>
        Six races.
        <strong>Relived lap by lap.</strong>
      </h1>
      <p className="theatre-intro">
        Every car's position comes from the lap times recorded that day. Choose a
        race and watch it unfold.
      </p>
      <div className="theatre-grid">
        {momentList.map((m) => {
          const race = tracks[m.id];
          const driver = drivers.find((d) => d.id === m.driverId);
          return (
            <button key={m.id} className="moment-card" onClick={() => onPick(m.id)}>
              <svg viewBox="-0.05 -0.05 1.1 1.1" aria-hidden="true">
                {race && (
                  <polygon
                    points={race.track.map(([x, y]) => `${x},${y}`).join(" ")}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.014"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
              <span className="moment-year">{m.season}</span>
              <strong>{titleOf(m)}</strong>
              <span className="moment-meta">
                {driver?.name} · {m.circuit}
              </span>
              <span className="moment-play">
                <Play size={14} /> Watch
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Replay({
  meta,
  onBack,
  onVisitBay,
}: {
  meta: MomentMeta;
  onBack: () => void;
  onVisitBay: (driverId: string, season: number) => void;
}) {
  const [race, setRace] = useState<RaceData | null>(null);
  const [phase, setPhase] = useState<"title" | "playing" | "finished">("title");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [camera, setCamera] = useState<CameraMode>("cinematic");
  const [hud, setHud] = useState({ t: 0 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const clock = useRef({ t: 0, reveal: 0, view: overview() as View, placed: false });
  const story = momentStory(meta.id);

  useEffect(() => {
    let live = true;
    loadRace(meta.id).then((r) => live && setRace(r));
    return () => {
      live = false;
    };
  }, [meta.id]);
  const track = useMemo(() => (race ? new Track(race.track) : null), [race]);
  const duration = race ? raceDuration(race) : 1;
  const focus = useMemo(
    () => race?.drivers.find((d) => d.id === meta.driverId) ?? race?.drivers.find((d) => d.ferrari),
    [race, meta.driverId],
  );

  // The animation loop: advances race time, eases the camera, paints.
  useEffect(() => {
    if (!race || !track) return;
    const el = canvas.current!;
    const ctx = el.getContext("2d")!;
    let frame = 0;
    let last = performance.now();
    let hudAt = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const loop = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      const c = clock.current;
      if (!c.placed) {
        c.view = overview(track);
        c.placed = true;
      }
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (el.width !== Math.round(w * dpr)) {
        el.width = Math.round(w * dpr);
        el.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.reveal = reduced ? 1 : Math.min(1, c.reveal + dt / 1800);
      if (playing && c.reveal >= 1) {
        c.t = Math.min(duration, c.t + dt * (duration / PLAYBACK_MS) * speed);
        if (c.t >= duration) {
          setPlaying(false);
          setPhase("finished");
        }
      }
      const cars = raceState(race, c.t);
      const lead = cars.find((x) => x.driver.id === focus?.id && x.running) ?? cars.find((x) => x.driver.ferrari && x.running);
      // Cinematic: alternate 10 s following the Ferrari with 10 s of the whole circuit.
      const followOn =
        camera === "follow" || (camera === "cinematic" && playing && Math.floor(now / 10_000) % 2 === 0);
      let target = overview(track);
      if (followOn && lead) {
        const p = track.at(lead.distance);
        target = { cx: p.x, cy: p.y, zoom: 2.6 };
      }
      // Track the car tightly once close; glide gently when switching shots.
      const settled = Math.abs(c.view.zoom - target.zoom) < 0.05;
      c.view = reduced ? target : lerpView(c.view, target, Math.min(1, dt / (followOn && settled ? 120 : 700)));
      const band = h * 0.07;
      const phone = w < 760;
      drawRace(ctx, w, h, track, cars, c.view, {
        reveal: c.reveal,
        focusId: focus?.id ?? null,
        insets: {
          left: phone ? 16 : w * 0.04,
          right: phone ? 150 : 250,
          top: band + (phone ? 70 : 90),
          bottom: band + (phone ? 130 : 90),
        },
      });
      if (now - hudAt > 120) {
        hudAt = now;
        setHud({ t: c.t });
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [race, track, playing, speed, camera, duration, focus, phase]);

  if (!race || !track)
    return (
      <div className="replay-loading">
        <span />
        Loading the race…
      </div>
    );

  const cars = raceState(race, hud.t);
  const leader = cars[0];
  const leaderLap = Math.min(race.laps, Math.max(1, Math.floor(leader.distance) + 1));
  const caption = [...(story?.captions ?? [])]
    .reverse()
    .find((c) => c.lap <= leaderLap && leaderLap - c.lap < 4);
  // Timing-screen order: laps completed, then time at the last line crossed.
  const timing = [...cars].sort((a, b) => {
    const la = Math.max(0, Math.floor(a.distance));
    const lb = Math.max(0, Math.floor(b.distance));
    if (la !== lb) return lb - la;
    if (la === 0) return a.driver.grid - b.driver.grid;
    return a.driver.cumulative[la - 1] - b.driver.cumulative[la - 1];
  });
  const tower = timing.filter((c, i) => i < 10 || c.driver.ferrari);
  const podium = [...race.drivers].filter((d) => d.finish <= 3).sort((a, b) => a.finish - b.finish);
  const sources = momentSources(meta.id);
  const museumDriver = drivers.find((d) => d.id === meta.driverId);

  const begin = () => {
    clock.current.t = 0;
    setPhase("playing");
    setPlaying(true);
  };
  return (
    <div className={`replay replay-${phase}-phase`}>
      <canvas ref={canvas} className="replay-canvas" aria-label={`Replay of the ${race.season} ${race.raceName}`} />
      <div className="letterbox top" />
      <div className="letterbox bottom" />

      {phase === "title" && (
        <div className="replay-title">
          <span className="eyebrow">
            <span className="tiny-line" />
            LEGENDARY MOMENTS · {race.season}
          </span>
          <h1>{titleOf(meta)}</h1>
          <p className="replay-sub">
            {race.raceName} · {race.circuitName} · {formatDate(race.date)}
            {story?.conditions ? ` · ${story.conditions}` : ""}
          </p>
          {story?.summary && <p className="replay-summary">{story.summary}</p>}
          <div className="replay-title-actions">
            <button className="tour-primary" onClick={begin}>
              <Play size={16} /> Watch the race
            </button>
            <button className="tour-secondary" onClick={onBack}>
              All moments
            </button>
          </div>
        </div>
      )}

      {phase !== "title" && (
        <>
          <div className="replay-hud">
            <span className="eyebrow">
              {race.season} {race.raceName.toUpperCase()}
            </span>
            <strong>
              LAP {leaderLap}
              <span> / {race.laps}</span>
            </strong>
          </div>
          <ol className="replay-tower" aria-label="Running order">
            {tower.map((c) => {
              const pos = timing.indexOf(c) + 1;
              const out = !c.running && !c.finished && hud.t > 0;
              return (
                <li key={c.driver.id} className={`${c.driver.ferrari ? "ferrari" : ""} ${out ? "out" : ""}`}>
                  <span className="pos">{pos}</span>
                  <span className="code">{c.driver.code}</span>
                  <span className="gap">
                    {out ? "OUT" : pos === 1 ? (c.finished ? "WIN" : "LEAD") : gapToLeader(c, timing[0]) ?? ""}
                  </span>
                </li>
              );
            })}
          </ol>
          {caption && phase === "playing" && (
            <p className="replay-caption" key={caption.lap + caption.text}>
              <span>LAP {caption.lap}</span>
              {caption.text}
            </p>
          )}
          <div className="replay-controls">
            <button className="icon-button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"} disabled={phase === "finished"}>
              {playing ? <Pause size={17} /> : <Play size={17} />}
            </button>
            <button className="icon-button" onClick={begin} aria-label="Restart">
              <RotateCcw size={16} />
            </button>
            <input
              type="range"
              min={0}
              max={race.laps}
              value={Math.floor(leader.distance)}
              aria-label="Lap"
              onChange={(e) => {
                clock.current.t = timeAtLap(race, Number(e.target.value));
                if (phase === "finished") setPhase("playing");
              }}
            />
            <div className="replay-seg" role="group" aria-label="Speed">
              {SPEEDS.map((s) => (
                <button key={s} aria-pressed={speed === s} onClick={() => setSpeed(s)}>
                  {s}×
                </button>
              ))}
            </div>
            <div className="replay-seg" role="group" aria-label="Camera">
              {(["cinematic", "overview", "follow"] as CameraMode[]).map((m) => (
                <button key={m} aria-pressed={camera === m} onClick={() => setCamera(m)}>
                  {m === "follow" ? "Ferrari" : m[0].toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
            <button className="icon-button" onClick={onBack} aria-label="Back to all moments">
              <X size={18} />
            </button>
          </div>
        </>
      )}

      {phase === "finished" && (
        <div className="replay-finish">
          <div className="chequer" aria-hidden="true" />
          <span className="eyebrow">CHEQUERED FLAG</span>
          <ol>
            {podium.map((d) => (
              <li key={d.id} className={d.ferrari ? "ferrari" : ""}>
                <span>P{d.finish}</span>
                {d.name}
                <em>{d.team}</em>
              </li>
            ))}
          </ol>
          <div className="replay-title-actions">
            <button className="tour-primary" onClick={begin}>
              <RotateCcw size={15} /> Watch again
            </button>
            {museumDriver && (
              <button className="tour-secondary" onClick={() => onVisitBay(meta.driverId, meta.season)}>
                {museumDriver.name.split(" ").at(-1)}'s bay <ArrowUpRight size={14} />
              </button>
            )}
            <button className="tour-secondary" onClick={onBack}>
              All moments
            </button>
          </div>
        </div>
      )}

      <p className="replay-credit">
        Positions interpolated from lap times ·{" "}
        <a href={race.sources.laps} target="_blank" rel="noreferrer">
          Jolpica <ExternalLink size={10} />
        </a>{" "}
        · circuit outline{" "}
        <a href={race.sources.circuit} target="_blank" rel="noreferrer">
          bacinger/f1-circuits (MIT) <ExternalLink size={10} />
        </a>
        , today's layout
        {sources.length > 0 && (
          <>
            {" "}
            · captions{" "}
            {[...new Map(sources.map((s) => [s.publisher, s])).values()].map((s, i) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                {i > 0 && ", "}
                {s.publisher}
              </a>
            ))}
          </>
        )}
      </p>
    </div>
  );
}
