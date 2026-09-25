import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, Play, Activity, ListOrdered, Flag, X } from "lucide-react";
import type { Driver } from "../data/drivers";
import { momentFor, momentStory } from "../features/moments/moments";
import { labFor } from "../features/racelab/labData";
import { keyRacesFor } from "../data/seasonStories";
import { drivers, getHistory, seasonStory } from "../data/drivers";
import { useEscape } from "../app/useEscape";
const pad = (n: number) => String(n).padStart(2, "0");
interface Props {
  driver: Driver;
  year: number;
  setYear: (v: number) => void;
  details: boolean;
  setDetails: (v: boolean | ((previous: boolean) => boolean)) => void;
  onStartTour: () => void;
  onWatchMoment: (id: string) => void;
  onOpenLab: (id: string) => void;
  index: number;
  selectDriver: (v: number) => void;
}

// The season dock along the bottom of the garage: timeline, the season's story
// and numbers, and the ways further in. Race results and key races open in a
// drawer above it, so the page never needs to scroll.
export default function SeasonArchive({
  driver,
  year,
  setYear,
  details,
  setDetails,
  onStartTour,
  onWatchMoment,
  onOpenLab,
  index,
  selectDriver,
}: Props) {
  const history = getHistory(driver.id),
    season = history.seasons.find((s) => s.year === year),
    story = seasonStory(driver, year),
    moment = momentFor(driver.id, year),
    lab = labFor(driver.id, year),
    keyRaces = keyRacesFor(driver.id);
  const [moments, setMoments] = useState(false);
  const drawer = details ? "results" : moments ? "moments" : null;
  const close = () => {
    setDetails(false);
    setMoments(false);
  };
  // A new driver closes the drawer; Esc closes it too.
  useEffect(() => setMoments(false), [driver.id]);
  useEscape(close, drawer != null);
  const champion = driver.championshipsWithFerrari.includes(year);

  return (
    <section className="archive-panel dock">
      {drawer && (
        <div className="dock-drawer" role="region" aria-label={drawer === "results" ? "Race results" : "Moments to remember"}>
          <div className="dock-drawer-head">
            <span className="eyebrow">
              {drawer === "results" ? (
                <>
                  {year} GRAND PRIX CLASSIFICATIONS <span>FERRARI ONLY · SPRINTS EXCLUDED</span>
                </>
              ) : (
                <>MOMENTS TO REMEMBER · {driver.name.toUpperCase()}</>
              )}
            </span>
            <button className="icon-button" onClick={close} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          {drawer === "results" ? (
            <>
              <div className="race-grid">
                {season?.races.map((r, i) => (
                  <div key={`${r.name}-${i}`}>
                    <span>{r.name}</span>
                    <strong className={r.position === "1" ? "winner" : ""}>
                      {/^\d+$/.test(r.position) ? `P${r.position}` : r.position}
                    </strong>
                  </div>
                ))}
              </div>
              <p className="fine-print">
                R = retired · D = disqualified · W = withdrawn · F = failed to qualify · N = not classified.
                Entries can include non-starts.
              </p>
            </>
          ) : (
            <ol className="key-races-list">
              {keyRaces.map((r) => (
                <li key={r.year + r.race} className={r.year === year ? "current" : ""}>
                  <button onClick={() => setYear(r.year)} aria-label={`Open ${r.year}`}>
                    {r.year}
                  </button>
                  <div>
                    <strong>{r.race.replace(/^\d{4} /, "")}</strong>
                    <p>{r.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="dock-timeline">
        <span className="eyebrow">
          A CAREER IN RED <span>{driver.ferrariYears}</span>
        </span>
        <div className="timeline" aria-label={`${driver.name} season timeline`}>
          {history.seasons.map((s) => {
            const won = driver.championshipsWithFerrari.includes(s.year);
            return (
              <button
                key={s.year}
                aria-pressed={year === s.year}
                className={`${year === s.year ? "active" : ""} ${won ? "won" : ""}`}
                onClick={() => {
                  setYear(s.year);
                  setDetails(false);
                }}
                title={won ? `${s.year} · World champion` : String(s.year)}
              >
                <i />
                <span>{s.year}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="dock-season" aria-live="polite">
        <div className="season-year">
          {year}
          <span className={champion ? "champion" : ""}>{champion ? "WORLD CHAMPION" : "SEASON ARCHIVE"}</span>
        </div>
        <div className="season-story">
          <h2>{story?.title}</h2>
          <p>{story?.story}</p>
        </div>
        <div className="season-numbers">
          <div>
            <strong>{pad(season?.wins ?? 0)}</strong>
            <span>WINS</span>
          </div>
          <div>
            <strong>{pad(season?.podiums ?? 0)}</strong>
            <span>PODIUMS</span>
          </div>
        </div>
        <div className="dock-actions">
          {moment && (
            <button className="dock-action primary" onClick={() => onWatchMoment(moment.id)}>
              <Play size={13} /> Watch: {momentStory(moment.id)?.title?.split(": ")[0] ?? moment.fallbackTitle}
            </button>
          )}
          {lab && (
            <button className="dock-action" onClick={() => onOpenLab(lab)}>
              <Activity size={13} /> Race Lab
            </button>
          )}
          <button
            className="dock-action"
            aria-expanded={drawer === "results"}
            onClick={() => {
              setMoments(false);
              setDetails((v) => !v);
            }}
          >
            <ListOrdered size={13} /> Results
          </button>
          {keyRaces.length > 0 && (
            <button
              className="dock-action"
              aria-expanded={drawer === "moments"}
              onClick={() => {
                setDetails(false);
                setMoments((v) => !v);
              }}
            >
              <Flag size={13} /> Key races
            </button>
          )}
        </div>
      </div>

      {/* Phone layout only: the top stepper and tour are not in view there. */}
      <div className="tour-bar">
        <button className="tour-start" onClick={onStartTour}>
          <Play size={14} /> Start guided tour
        </button>
        <div className="next-controls">
          <button
            className="icon-button"
            aria-label="Previous driver"
            onClick={() => selectDriver((index + drivers.length - 1) % drivers.length)}
          >
            <ArrowLeft size={18} />
          </button>
          <button className="next-driver" onClick={() => selectDriver((index + 1) % drivers.length)}>
            NEXT DRIVER <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
