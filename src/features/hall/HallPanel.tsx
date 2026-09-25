import { useEffect } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { playChime } from "../../audio/soundEngine";
import { champions, inWords, titleCount, useHallStore } from "./champions";
import type { Champion } from "./champions";
import { useEscape } from "../../app/useEscape";

// The Hall of Champions: every Ferrari drivers' title, each a way into the bay.
export default function HallPanel({
  onExit,
  onOpen,
}: {
  onExit: () => void;
  onOpen: (champion: Champion, year: number) => void;
}) {
  const focus = useHallStore((s) => s.focus);
  const setFocus = useHallStore((s) => s.setFocus);
  // A warm chord as the camera arrives at the end of the corridor.
  useEffect(() => {
    const t = window.setTimeout(playChime, 2600);
    return () => {
      window.clearTimeout(t);
      useHallStore.getState().setFocus(null);
    };
  }, []);
  // Esc steps back from a station to the whole room.
  useEscape(() => setFocus(null), focus != null);
  const studied = focus != null ? champions[focus] : null;
  return (
    <div className={`hall-panel ${studied ? "studying" : ""}`}>
      <button className="back-link hall-back" onClick={onExit}>
        <ArrowLeft size={13} /> THE GARAGE
      </button>
      <div className="eyebrow">
        <span className="tiny-line" />
        HALL OF CHAMPIONS
      </div>
      <h1>
        {inWords(titleCount)} titles.
        <strong>{inWords(champions.length)} champions.</strong>
      </h1>
      <p className="hall-intro">
        Every drivers' world championship won in a Ferrari. Choose a year to
        open that season in the driver's bay.
      </p>
      {studied && (
        <div className="hall-study" aria-live="polite">
          <span className="eyebrow">NOW STUDYING · DRAG TO ORBIT · SCROLL TO ZOOM</span>
          <strong>{studied.driver.name}</strong>
          <p>
            {studied.titles.map((t) => t.year).join(" · ")} ·{" "}
            {[...new Set(studied.titles.map((t) => t.car).filter(Boolean))].join(" · ")}
          </p>
          <div className="hall-study-actions">
            <button className="tour-secondary" onClick={() => setFocus(null)}>
              <ArrowLeft size={14} /> Whole hall
            </button>
            <button className="tour-primary" onClick={() => onOpen(studied, studied.titles[0].year)}>
              Enter the bay <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      )}
      <ol className="hall-list">
        {champions.map((c) => (
          <li key={c.driver.id}>
            <button
              className="hall-name"
              aria-pressed={focus === champions.indexOf(c)}
              onClick={() => setFocus(champions.indexOf(c))}
              title="Study the helmet and trophies"
            >
              {c.driver.name}
            </button>
            <span className="hall-years">
              {c.titles.map((t) => (
                <button
                  key={t.year}
                  onClick={() => onOpen(c, t.year)}
                  aria-label={`Open ${c.driver.name}, ${t.year}${t.car ? `, ${t.car}` : ""}`}
                >
                  {t.year}
                  <ArrowUpRight size={12} />
                </button>
              ))}
            </span>
          </li>
        ))}
      </ol>
      <p className="fine-print">
        Drivers' titles won with Ferrari. Titles won with other teams appear in
        each driver's bay.
      </p>
    </div>
  );
}
