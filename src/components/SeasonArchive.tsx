import { ArrowRight, ArrowLeft, Play, Plus, Minus, Activity } from "lucide-react";
import type { Driver } from "../data/drivers";
import { momentFor, momentStory } from "../features/moments/moments";
import { labFor } from "../features/racelab/labData";
import { keyRacesFor } from "../data/seasonStories";
import { drivers, getHistory, seasonStory } from "../data/drivers";
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
    lab = labFor(driver.id, year);
  return (
    <section className="archive-panel">
      <div className="timeline-heading">
        <div>
          <span className="eyebrow">A CAREER IN RED</span>
          <span className="timeline-caption">Select a season to explore</span>
        </div>
        <span className="eyebrow">{driver.ferrariYears}</span>
      </div>
      <div className="timeline" aria-label={`${driver.name} season timeline`}>
        {history.seasons.map((s) => (
          <button
            key={s.year}
            aria-pressed={year === s.year}
            className={year === s.year ? "active" : ""}
            onClick={() => {
              setYear(s.year);
              setDetails(false);
            }}
          >
            <span>{s.year}</span>
            <i
              className={
                driver.championshipsWithFerrari.includes(s.year)
                  ? "title-year"
                  : ""
              }
            />
            {driver.championshipsWithFerrari.includes(s.year) && (
              <span className="champion-label">CHAMPION</span>
            )}
          </button>
        ))}
      </div>
      <div className="season-content" aria-live="polite">
        <div className="season-year">
          {year}
          <span>
            {driver.championshipsWithFerrari.includes(year)
              ? "WORLD CHAMPION"
              : "SEASON ARCHIVE"}
          </span>
        </div>
        <div className="season-story">
          <h2>{story?.title}</h2>
          <p>{story?.story}</p>
          {moment && (
            <button className="watch-moment" onClick={() => onWatchMoment(moment.id)}>
              <Play size={13} /> Watch the race: {momentStory(moment.id)?.title ?? moment.fallbackTitle}
            </button>
          )}
          {lab && (
            <button className="watch-moment lab-season" onClick={() => onOpenLab(lab)}>
              <Activity size={13} /> Race Lab: qualifying telemetry
            </button>
          )}
        </div>
        <div className="season-numbers">
          <div>
            <strong>{pad(season?.wins ?? 0)}</strong>
            <span>SEASON WINS</span>
          </div>
          <div>
            <strong>{pad(season?.podiums ?? 0)}</strong>
            <span>PODIUMS</span>
          </div>
        </div>
        <button
          className="round-button"
          onClick={() => setDetails((v) => !v)}
          aria-label={
            details ? "Hide season race results" : "Show season race results"
          }
          aria-expanded={details}
        >
          {details ? <Minus size={20} /> : <Plus size={20} />}
        </button>
      </div>
      {keyRacesFor(driver.id).length > 0 && (
        <div className="key-races">
          <span className="eyebrow">MOMENTS TO REMEMBER</span>
          <ol>
            {keyRacesFor(driver.id).map((r) => (
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
        </div>
      )}
      {details && (
        <div className="race-results">
          <div className="eyebrow">
            {year} GRAND PRIX CLASSIFICATIONS{" "}
            <span>FERRARI ONLY · SPRINTS EXCLUDED</span>
          </div>
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
          <div className="exhibit-context">
            <div>
              <span className="eyebrow">IMPORTANT CARS · FERRARI PERIOD</span>
              <p>{driver.importantCars.join(" / ")}</p>
            </div>

          </div>
          <p className="fine-print">
            R = retired · D = disqualified · W = withdrawn · F = failed to
            qualify · N = not classified. Entries can include non-starts.
          </p>
        </div>
      )}
      <div className="tour-bar">
        <button className="tour-start" onClick={onStartTour}>
          <Play size={14} /> Start guided tour
        </button>
        <span className="tour-location">
          {driver.number} <span>/ 17</span>
          <span className="small-red">—</span>
          {driver.era}
        </span>
        <div className="next-controls">
          <button
            className="icon-button"
            aria-label="Previous driver"
            onClick={() =>
              selectDriver((index + drivers.length - 1) % drivers.length)
            }
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="next-driver"
            onClick={() => selectDriver((index + 1) % drivers.length)}
          >
            NEXT DRIVER <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
