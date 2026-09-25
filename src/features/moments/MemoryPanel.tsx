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
  const photos = m?.photos ?? [];
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
            <a href={photo.credit.sourceUrl} target="_blank" rel="noreferrer">
              {photo.credit.attribution}
            </a>
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
