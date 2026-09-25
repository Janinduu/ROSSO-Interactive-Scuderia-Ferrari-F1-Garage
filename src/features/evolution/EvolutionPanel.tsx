import { useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react";
import { engineProfile } from "../../audio/engineProfile";
import { playEngine, stopEngine } from "../../audio/soundEngine";
import { useSoundStore } from "../../audio/soundStore";
import {
  DURATION_MS,
  milestoneAt,
  milestones,
  timeOf,
  useEvolutionStore,
  yearAt,
} from "./evolution";

// Drives the 75-second sequence and shows where it is. The 3D room reads the
// same store, so the wall, turntable and panel always agree.
export default function EvolutionPanel({ onExit }: { onExit: () => void }) {
  const { playing, elapsed, play, pause, restart, seek, tick } = useEvolutionStore();
  const soundOn = useSoundStore((s) => s.enabled);
  const index = milestoneAt(elapsed);
  const m = milestones[index];
  const year = yearAt(elapsed);
  // Stable per car, so effects keyed on it run once per car, not per frame.
  const profile = useMemo(() => engineProfile(m.car.officialName, m.year), [m]);

  // Start playing when the room opens; stop everything when it closes.
  useEffect(() => {
    useEvolutionStore.getState().restart();
    return () => {
      useEvolutionStore.getState().pause();
      stopEngine();
    };
  }, []);

  // Clock: advances only while playing.
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      tick(now - last);
      last = now;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing, tick]);

  // Each car announces itself with a short rev in its own voice.
  const lastIndex = useRef(-1);
  useEffect(() => {
    if (index === lastIndex.current || !playing || !soundOn) return;
    // Marked only once it plays, so the first car revs when playback begins.
    lastIndex.current = index;
    // Audio may still be starting from the click that opened the room.
    if (playEngine(profile, undefined, { once: true })) return;
    const retry = window.setTimeout(() => playEngine(profile, undefined, { once: true }), 400);
    return () => window.clearTimeout(retry);
  }, [index, playing, soundOn, profile]);

  const progress = elapsed / DURATION_MS;
  return (
    <div className="evolution-panel">
      <button className="back-link evolution-back" onClick={onExit}>
        <ArrowLeft size={13} /> THE GARAGE
      </button>
      <div className="eyebrow">
        <span className="tiny-line" />
        THE EVOLUTION · 1950 — 2026
      </div>
      <h1>
        75 years
        <strong>in 75 seconds.</strong>
      </h1>
      <div className="evolution-now" aria-live="polite">
        <span className="evolution-year">{year}</span>
        <div>
          <h2>{m.car.officialName}</h2>
          <p>
            {m.driverName} · {m.year}
          </p>
          <p className="fine-print">
            {profile.label} · {m.car.spec.familyLabel}
          </p>
        </div>
      </div>
      <div className="evolution-controls">
        <button className="tour-primary" onClick={playing ? pause : play}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? "Pause" : elapsed >= DURATION_MS ? "Play again" : "Play"}
        </button>
        <button className="tour-secondary" onClick={restart}>
          <RotateCcw size={15} /> Restart
        </button>
      </div>
      <div className="evolution-progress" aria-hidden="true">
        <b style={{ transform: `scaleX(${progress})` }} />
      </div>
      <ol className="evolution-strip" aria-label="Cars in the sequence">
        {milestones.map((ms, i) => (
          <li key={ms.car.id}>
            <button
              aria-current={i === index}
              onClick={() => {
                seek(timeOf(i));
                if (!playing && soundOn)
                  playEngine(engineProfile(ms.car.officialName, ms.year), undefined, { once: true });
              }}
            >
              <span>{ms.year}</span>
              {ms.car.officialName}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
