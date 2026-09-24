import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, X } from "lucide-react";
import { useCameraStore } from "../../3d/camera/cameraStore";
import { useMuseumStore } from "../../stores/museumStore";
import { tourSteps, useTourStore } from "./tourStore";

const pad = (n: number) => String(n).padStart(2, "0");

// Runs the tour: stages each step's scene, asks the CameraDirector for its pose,
// and only starts the dwell clock once the camera has actually arrived. Timing
// never guesses how long an animation takes (spec §16.3, §48).
export default function GuidedTour({ mobile }: { mobile: boolean }) {
  const { active, stepIndex, paused, stop, next, previous, start, togglePause } =
    useTourStore();
  const arrivedId = useCameraStore((s) => s.arrivedId);
  const [requestId, setRequestId] = useState(-1);
  const [progress, setProgress] = useState(0);
  const elapsed = useRef(0);
  const step = tourSteps[stepIndex];
  const arrived = requestId >= 0 && arrivedId >= requestId;

  // Enter a step.
  useEffect(() => {
    if (!active) return;
    useMuseumStore.getState().stage({ entered: true, ...step.scene });
    setRequestId(useCameraStore.getState().go(step.camera, { lock: true }));
    elapsed.current = 0;
    setProgress(0);
    if (stepIndex === 0) {
      const scene = document.querySelector(".scene");
      if (mobile) scene?.scrollIntoView({ block: "center" });
      else window.scrollTo({ top: 0 });
    }
  }, [active, stepIndex, step, mobile]);

  // Dwell clock: runs only after arrival and while not paused.
  useEffect(() => {
    if (!active || !arrived || paused || !Number.isFinite(step.durationMs))
      return;
    const startedAt = performance.now() - elapsed.current;
    const id = window.setInterval(() => {
      elapsed.current = performance.now() - startedAt;
      setProgress(Math.min(1, elapsed.current / step.durationMs));
      if (elapsed.current >= step.durationMs) {
        window.clearInterval(id);
        useTourStore.getState().advanceFrom(stepIndex);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [active, arrived, paused, stepIndex, step]);

  // Keyboard: Esc leaves, arrows step. Dialogs keep their own Esc handling.
  useEffect(() => {
    if (!active) return;
    const key = (e: KeyboardEvent) => {
      if (document.querySelector("dialog[open]")) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, select, textarea")) return;
      if (e.key === "Escape") stop();
      else if (e.key === "ArrowRight" && step.allowSkip) next();
      else if (e.key === "ArrowLeft") previous();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [active, step, stop, next, previous]);

  if (!active) return null;
  const last = stepIndex === tourSteps.length - 1;
  return (
    <section
      className="tour-card"
      role="region"
      aria-label="Guided tour"
      data-step={step.id}
    >
      <div className="tour-card-top">
        <span className="eyebrow">
          <span className="tiny-line" />
          {step.kicker}
        </span>
        <span className="tour-count">
          {pad(stepIndex + 1)} <span>/ {pad(tourSteps.length)}</span>
        </span>
        <button
          className="icon-button"
          onClick={stop}
          aria-label="Exit guided tour"
        >
          <X size={18} />
        </button>
      </div>
      <div aria-live="polite">
        <h2>{step.title}</h2>
        <p>{step.narration}</p>
      </div>
      <div className="tour-progress" aria-hidden="true">
        {tourSteps.map((s, i) => (
          <i key={s.id}>
            <b
              style={{
                transform: `scaleX(${i < stepIndex ? 1 : i === stepIndex ? progress : 0})`,
              }}
            />
          </i>
        ))}
      </div>
      {last ? (
        <div className="tour-controls">
          <button className="tour-secondary" onClick={start}>
            <RotateCcw size={15} /> Restart tour
          </button>
          <button className="tour-primary" onClick={stop}>
            Explore freely <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="tour-controls">
          <button
            className="icon-button"
            onClick={previous}
            disabled={stepIndex === 0}
            aria-label="Previous step"
          >
            <ArrowLeft size={17} />
          </button>
          <button
            className="tour-secondary"
            onClick={togglePause}
            aria-pressed={paused}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            className="tour-primary"
            onClick={next}
            disabled={!step.allowSkip}
          >
            {arrived ? "Next" : "Skip"} <ArrowRight size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
