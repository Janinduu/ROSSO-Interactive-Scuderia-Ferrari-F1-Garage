import { useEffect } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { playChime } from "../../audio/soundEngine";
import { champions, inWords, titleCount } from "./champions";
import type { Champion } from "./champions";

// The Hall of Champions: every Ferrari drivers' title, each a way into the bay.
export default function HallPanel({
  onExit,
  onOpen,
}: {
  onExit: () => void;
  onOpen: (champion: Champion, year: number) => void;
}) {
  // A warm chord as the camera arrives at the end of the corridor.
  useEffect(() => {
    const t = window.setTimeout(playChime, 2600);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="hall-panel">
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
      <ol className="hall-list">
        {champions.map((c) => (
          <li key={c.driver.id}>
            <span className="hall-name">{c.driver.name}</span>
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
