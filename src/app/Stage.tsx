import { useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";

// The whole museum is composed once at 1600 × 900 and scaled to fit the
// window, so every visitor sees the same frame whatever their screen size.
// Phones in portrait keep the responsive layout, where a scaled 16:9 frame
// would be too small to read.
export const DESIGN_W = 1600;
export const DESIGN_H = 900;

function measure() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const staged = w >= 900 && w / h >= 1.15;
  return { staged, scale: Math.min(w / DESIGN_W, h / DESIGN_H) };
}

export default function Stage({ children }: { children: ReactNode }) {
  const [s, setS] = useState(measure);
  useLayoutEffect(() => {
    const update = () => setS(measure());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("staged", s.staged);
    root.style.setProperty("--stage-scale", String(s.staged ? s.scale : 1));
  }, [s]);
  if (!s.staged) return <>{children}</>;
  return (
    <div className="stage-viewport">
      <div
        className="stage"
        style={{ width: DESIGN_W, height: DESIGN_H, transform: `translate(-50%, -50%) scale(${s.scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
