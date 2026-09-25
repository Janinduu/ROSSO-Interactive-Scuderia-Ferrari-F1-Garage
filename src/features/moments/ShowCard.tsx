import type { ReactNode } from "react";
import { Play } from "lucide-react";

// A gallery card shared by the Theatre and the Race Lab: the circuit on its own
// lit stage, and the words on a caption band beneath it, never on top of it.
export default function ShowCard({
  track,
  year,
  chip,
  kicker,
  title,
  story,
  meta,
  action,
  tone = "red",
  onClick,
}: {
  /** Closed or open polyline in a 0..1 box. */
  track: [number, number][] | null;
  year: number | string;
  chip?: string;
  kicker: string;
  title: string;
  story?: string;
  meta?: ReactNode;
  action: string;
  tone?: "red" | "gold";
  onClick: () => void;
}) {
  const pts = track?.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(" ");
  return (
    <button className={`show-card tone-${tone}`} onClick={onClick}>
      <div className="show-stage" aria-hidden="true">
        {pts && (
          <svg viewBox="-0.08 -0.08 1.16 1.16" preserveAspectRatio="xMidYMid meet">
            <polyline className="show-track-base" points={pts} />
            <polyline className="show-track-line" points={pts} />
            <circle cx={track![0][0]} cy={track![0][1]} r="0.018" className="show-start" />
          </svg>
        )}
        <span className="show-year">{year}</span>
        {chip && <span className="show-chip">{chip}</span>}
      </div>
      <div className="show-body">
        <span className="show-kicker">{kicker}</span>
        <strong>{title}</strong>
        {story && <p>{story}</p>}
        {meta && <span className="show-meta">{meta}</span>}
        <span className="show-action">
          <Play size={13} /> {action}
        </span>
      </div>
    </button>
  );
}

/** Scale any list of points into a 0..1 box (y already pointing down). */
export function normalise(points: [number, number][]): [number, number][] {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  const w = Math.max(...xs) - x0;
  const h = Math.max(...ys) - y0;
  const k = 1 / Math.max(w, h);
  // Centre the shorter side.
  const dx = (1 - w * k) / 2;
  const dy = (1 - h * k) / 2;
  return points.map(([x, y]) => [(x - x0) * k + dx, (y - y0) * k + dy]);
}
