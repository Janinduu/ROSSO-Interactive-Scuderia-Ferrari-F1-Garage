import { ArrowLeft, ArrowUpRight, ExternalLink } from "lucide-react";
import { dreamTeam, legacySource, longestRun, titles, useLegacyStore } from "./legacy";
import { inWords } from "../hall/champions";

// The Legacy room: all constructors' titles, with the story of each season.
export default function LegacyPanel({
  onExit,
  onOpenBay,
}: {
  onExit: () => void;
  onOpenBay: (bay: number, year: number) => void;
}) {
  const selected = useLegacyStore((s) => s.selected);
  const select = useLegacyStore((s) => s.select);
  const t = titles.find((x) => x.year === selected);
  const inDreamTeamEra = t && t.year >= 1999 && t.year <= 2004;
  return (
    <div className="legacy-panel">
      <button className="back-link legacy-back" onClick={onExit}>
        <ArrowLeft size={13} /> THE GARAGE
      </button>
      <div className="eyebrow">
        <span className="tiny-line" />
        THE LEGACY · CONSTRUCTORS' CHAMPIONS
      </div>
      <h1>
        {inWords(titles.length)} titles.
        <strong>One Scuderia.</strong>
      </h1>
      <p className="legacy-intro">
        The constructors' championship crowns the team: its cars, its people
        and every point both drivers bring home. Ferrari has won it more often
        than anyone, including {inWords(longestRun[1] - longestRun[0] + 1).toLowerCase()}{" "}
        in a row from {longestRun[0]} to {longestRun[1]}.
      </p>
      <div className="legacy-years" role="list">
        {titles.map((x) => (
          <button
            key={x.year}
            role="listitem"
            aria-pressed={selected === x.year}
            onClick={() => select(selected === x.year ? null : x.year)}
          >
            {x.year}
          </button>
        ))}
      </div>
      {t ? (
        <div className="legacy-detail" aria-live="polite">
          <div className="legacy-detail-head">
            <span className="legacy-year">{t.year}</span>
            <div>
              <h2>{t.car.join(" · ") || "Constructors' champions"}</h2>
              <p>
                {t.wins} {t.wins === 1 ? "win" : "wins"} · {t.points} points
              </p>
            </div>
          </div>
          {t.note && <p className="legacy-note">{t.note}</p>}
          <dl>
            <dt>Drivers</dt>
            <dd>
              {t.drivers.map((d, i) => (
                <span key={d.id}>
                  {i > 0 && ", "}
                  {d.bay != null ? (
                    <button className="legacy-link" onClick={() => onOpenBay(d.bay!, t.year)}>
                      {d.name}
                      <ArrowUpRight size={12} />
                    </button>
                  ) : (
                    d.name
                  )}
                </span>
              ))}
            </dd>
            {t.teamPrincipal && (
              <>
                <dt>{t.teamPrincipal.role}</dt>
                <dd>{t.teamPrincipal.name}</dd>
              </>
            )}
            {t.technicalLeads.length > 0 && (
              <>
                <dt>Technical</dt>
                <dd>{t.technicalLeads.map((p) => `${p.name} (${p.role})`).join(", ")}</dd>
              </>
            )}
          </dl>
          {inDreamTeamEra && dreamTeam.length > 0 && (
            <div className="legacy-dream">
              <span className="eyebrow">THE DREAM TEAM</span>
              <p>{dreamTeam.map((p) => `${p.name} · ${p.role}`).join("  /  ")}</p>
            </div>
          )}
          <div className="legacy-sources">
            {t.sources.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                {s.publisher} <ExternalLink size={11} />
              </a>
            ))}
            <a href={legacySource.replace("{year}", String(t.year))} target="_blank" rel="noreferrer">
              Jolpica standings <ExternalLink size={11} />
            </a>
          </div>
        </div>
      ) : (
        <p className="fine-print">Choose a year, or a trophy in the room, to open its season.</p>
      )}
    </div>
  );
}
