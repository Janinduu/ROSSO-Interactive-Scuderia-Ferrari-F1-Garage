import { useEffect, useState } from "react";
import type { RaceData } from "./moments";

// The right-hand side of a moment's title screen: photographs from that race
// weekend, the words from the day and the numbers that defined it. Photos,
// the quote and the headline stat come from the researched momentsMedia.json;
// the race facts come straight from the lap data.

interface Credit {
  creator?: string;
  license: string;
  sourceUrl: string;
  attribution: string;
}
interface Photo {
  src: string;
  alt: string;
  caption?: string;
  focalPoint?: [number, number];
  credit: Credit;
}
interface Media {
  moments?: Record<
    string,
    {
      photos?: Photo[];
      quote?: {
        text: string;
        speaker: string;
        context?: string;
        sourceIds?: string[];
      };
      stat?: { label: string; value: string; sourceIds?: string[] };
    }
  >;
  sources?: Record<string, { title: string; publisher: string; url: string }>;
}
const files = import.meta.glob<Media>("../../data/momentsMedia.json", {
  eager: true,
  import: "default",
});
const media: Media = Object.values(files)[0] ?? {};

// Owner-supplied photographs, shown before the Commons set on the owner's
// machine. Their reuse rights are not established, so the folder is
// git-ignored and they never ship from the public repository.
const localFiles = import.meta.glob<string>("../../assets/moments-local/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
  query: "?url",
});
const localCaptions: Record<string, { caption: string; alt: string; focalPoint?: [number, number] }> = {
  "barcelona-2026-1": {
    caption: "Hamilton celebrates in parc fermé, Barcelona 2026",
    alt: "Lewis Hamilton in Ferrari overalls and yellow helmet, fists raised after winning in Barcelona",
    focalPoint: [0.3, 0.3],
  },
  "barcelona-2026-2": {
    caption: "The winner's trophy, Barcelona 2026",
    alt: "Lewis Hamilton on the podium holding the Barcelona-Catalunya winner's trophy",
    focalPoint: [0.55, 0.35],
  },
  "barcelona-2026-3": {
    caption: "Into the arms of the Ferrari crew",
    alt: "Lewis Hamilton, seen from behind, celebrating with Ferrari team members waving flags",
    focalPoint: [0.55, 0.4],
  },
  "france-2004-1": {
    caption: "Schumacher takes the flag, Magny-Cours 2004",
    alt: "Michael Schumacher's Ferrari F2004 crossing the line as the crew cheers from the pit wall",
    focalPoint: [0.5, 0.6],
  },
  "france-2004-2": {
    caption: "The crew at work: four stops to beat Renault",
    alt: "Ferrari mechanics changing tyres on the F2004 during a pit stop",
    focalPoint: [0.45, 0.5],
  },
};
function localPhotos(raceId: string): Photo[] {
  return Object.entries(localFiles)
    .map(([path, src]) => ({ name: path.split("/").at(-1)!.replace(/\.\w+$/, ""), src }))
    .filter((f) => f.name.startsWith(`${raceId}-`))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((f) => ({
      src: f.src,
      alt: localCaptions[f.name]?.alt ?? "Race photograph",
      caption: localCaptions[f.name]?.caption,
      focalPoint: localCaptions[f.name]?.focalPoint,
      credit: {
        license: "Supplied by the project owner; rights not verified",
        sourceUrl: "",
        attribution: "Photo supplied by the project owner (local build only)",
      },
    }));
}

const fmt = (ms: number) => {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = ((ms % 60_000) / 1000).toFixed(3).padStart(6, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
};

export default function MemoryPanel({
  race,
  driverId,
}: {
  race: RaceData;
  driverId: string;
}) {
  const m = media.moments?.[race.id];
  const photos = [...localPhotos(race.id), ...(m?.photos ?? [])];
  const [index, setIndex] = useState(0);
  // A slow Ken Burns slideshow through the photographs.
  useEffect(() => {
    if (photos.length < 2) return;
    const t = window.setInterval(
      () => setIndex((i) => (i + 1) % photos.length),
      6500,
    );
    return () => window.clearInterval(t);
  }, [photos.length]);

  const hero =
    race.drivers.find((d) => d.id === driverId) ??
    race.drivers.find((d) => d.ferrari)!;
  const winner = race.drivers.find((d) => d.finish === 1)!;
  const second = race.drivers.find((d) => d.finish === 2);
  const margin =
    second && second.cumulative.length === winner.cumulative.length
      ? `+${((second.cumulative.at(-1)! - winner.cumulative.at(-1)!) / 1000).toFixed(3)} s`
      : null;
  const quoteSources = (m?.quote?.sourceIds ?? [])
    .map((id) => media.sources?.[id])
    .filter(Boolean);
  const photo = photos[index];

  return (
    <aside className="memory" aria-label="From the race">
      <div className={`memory-photos ${photos.length ? "" : "empty"}`}>
        {photos.map((p, i) => (
          <img
            key={p.src}
            src={p.src}
            alt={p.alt}
            className={i === index ? "on" : ""}
            style={{
              objectPosition: `${(p.focalPoint?.[0] ?? 0.5) * 100}% ${(p.focalPoint?.[1] ?? 0.4) * 100}%`,
            }}
            loading="lazy"
          />
        ))}
        {!photos.length && (
          // No licensed photograph found: a typographic plate instead.
          <div className="memory-plate">
            <span>{race.season}</span>
            <strong>{hero.name}</strong>
            <em>{race.raceName}</em>
          </div>
        )}
        {photo && (
          <p className="memory-caption">
            {photo.caption && <span>{photo.caption}</span>}
            {photo.credit.sourceUrl ? (
              <a href={photo.credit.sourceUrl} target="_blank" rel="noreferrer">
                {photo.credit.attribution}
              </a>
            ) : null /* The owner's own photos need no credit line. */}
          </p>
        )}
        {photos.length > 1 && (
          <div className="memory-dots" aria-hidden="true">
            {photos.map((p, i) => (
              <i key={p.src} className={i === index ? "on" : ""} />
            ))}
          </div>
        )}
      </div>

      {m?.quote && (
        <figure className="memory-quote">
          {/radio/i.test(m.quote.context ?? "") && (
            <span className="memory-radio" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          )}
          <blockquote>“{m.quote.text}”</blockquote>
          <figcaption>
            {m.quote.speaker}
            {m.quote.context && <span> · {m.quote.context}</span>}
            {quoteSources.length > 0 && (
              <a href={quoteSources[0]!.url} target="_blank" rel="noreferrer">
                {" "}
                · {quoteSources[0]!.publisher}
              </a>
            )}
          </figcaption>
        </figure>
      )}

      <dl className="memory-stats">
        {m?.stat && (
          <div className="featured">
            <dt>{m.stat.label}</dt>
            <dd>{m.stat.value}</dd>
          </div>
        )}
        <div>
          <dt>Grid → finish</dt>
          <dd>
            P{hero.grid} → P{hero.finish}
          </dd>
        </div>
        <div>
          <dt>Laps</dt>
          <dd>{race.laps}</dd>
        </div>
        <div>
          <dt>Race time</dt>
          <dd>{fmt(winner.cumulative.at(-1)!)}</dd>
        </div>
        {margin && !/margin/i.test(m?.stat?.label ?? "") && (
          <div>
            <dt>Margin</dt>
            <dd>{margin}</dd>
          </div>
        )}
      </dl>
    </aside>
  );
}
