import { useEffect } from "react";
import { X } from "lucide-react";
import { drivers, eras } from "../../data/drivers";
import type { Room } from "../../stores/museumStore";

// The museum's floor plan: every room and bay in one place, drawn like an
// architect's plan. Choosing a place closes the map and flies the camera there.

export type MapDestination =
  | { kind: "room"; room: Exclude<Room, "garage"> }
  | { kind: "bay"; index: number }
  | { kind: "machine" }
  | { kind: "theatre" };

/** Split a label into lines of at most `max` characters. */
function wrapWords(text: string, max: number) {
  const lines: string[] = [];
  for (const word of text.split(" ")) {
    const last = lines.at(-1);
    if (last && (last + " " + word).length <= max) lines[lines.length - 1] = last + " " + word;
    else lines.push(word);
  }
  return lines;
}

// Plan coordinates (viewBox 1000 × 460).
const CORRIDOR = { x0: 150, x1: 730, y: 230, h: 120 };
const chapterSpans = (() => {
  const counts = eras.map((e) => drivers.filter((d) => d.era === e).length);
  const total = counts.reduce((a, b) => a + b, 0);
  let x = CORRIDOR.x0;
  return eras.map((era, i) => {
    const w = ((CORRIDOR.x1 - CORRIDOR.x0) * counts[i]) / total;
    const span = { era, n: i + 1, x0: x, x1: x + w };
    x += w;
    return span;
  });
})();
const bayPos = (i: number) => {
  const w = (CORRIDOR.x1 - CORRIDOR.x0) / drivers.length;
  const x = CORRIDOR.x0 + w * (i + 0.5);
  const top = i % 2 === 0;
  return { x, y: top ? CORRIDOR.y - CORRIDOR.h / 2 - 34 : CORRIDOR.y + CORRIDOR.h / 2 + 34, top, w };
};

export default function MuseumMap({
  where,
  onGo,
  onClose,
}: {
  /** Current location: a room, or a bay index when in the garage. */
  where: { entered: boolean; room: Room; bay: number; theatre: boolean };
  onGo: (d: MapDestination) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const here =
    where.theatre
      ? { x: 350, y: 423 }
      : !where.entered
        ? { x: 70, y: 380 }
        : where.room === "evolution"
          ? { x: 86, y: CORRIDOR.y + 50 }
          : where.room === "hall"
            ? { x: 800, y: CORRIDOR.y + 50 }
            : where.room === "legacy"
              ? { x: 917, y: CORRIDOR.y + 70 }
              : { x: bayPos(where.bay).x, y: bayPos(where.bay).y };

  const roomRect = (
    key: string,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    sub: string,
    tone: "red" | "gold" | "plain",
    go: MapDestination,
  ) => (
    <g
      key={key}
      className={`map-room tone-${tone}`}
      role="button"
      tabIndex={0}
      aria-label={`${label}. ${sub}`}
      onClick={() => onGo(go)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onGo(go)}
    >
      <rect x={x} y={y} width={w} height={h} rx="2" />
      <text x={x + w / 2} y={y + h / 2 - 4} className="map-room-label">
        {label}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 14} className="map-room-sub">
        {sub}
      </text>
    </g>
  );

  return (
    <div className="museum-map" role="dialog" aria-modal="true" aria-label="Museum map">
      <div className="museum-map-head">
        <div>
          <span className="eyebrow">
            <span className="tiny-line" />
            ROSSO · FLOOR PLAN
          </span>
          <h1>The museum.</h1>
          <p>Choose a room or a bay. The red marker shows where you are.</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close map">
          <X size={20} />
        </button>
      </div>
      <svg className="museum-plan" viewBox="0 0 1000 460" role="group" aria-label="Floor plan">
        <defs>
          <pattern id="plan-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1000" height="460" fill="url(#plan-grid)" />
        {/* Outer walls. */}
        <rect x="20" y="70" width="960" height="320" className="map-wall" />
        {/* Corridor and chapter zones. */}
        <rect x={CORRIDOR.x0} y={CORRIDOR.y - CORRIDOR.h / 2} width={CORRIDOR.x1 - CORRIDOR.x0} height={CORRIDOR.h} className="map-corridor" />
        {chapterSpans.map((c) => (
          <g key={c.era}>
            <line x1={c.x0} x2={c.x0} y1={CORRIDOR.y - CORRIDOR.h / 2} y2={CORRIDOR.y + CORRIDOR.h / 2} className="map-threshold" />
            <text x={(c.x0 + c.x1) / 2} y={CORRIDOR.y - 6} className="map-chapter-n">
              {String(c.n).padStart(2, "0")}
            </text>
            {c.x1 - c.x0 > 60 &&
              wrapWords(c.era.toUpperCase(), c.x1 - c.x0 > 110 ? 30 : 12).map((line, k) => (
                <text key={k} x={(c.x0 + c.x1) / 2} y={CORRIDOR.y + 12 + k * 10} className="map-chapter">
                  {line}
                </text>
              ))}
          </g>
        ))}
        {/* Bays along both walls. */}
        {drivers.map((d, i) => {
          const p = bayPos(i);
          const current = where.entered && where.room === "garage" && !where.theatre && where.bay === i;
          return (
            <g
              key={d.id}
              className={`map-bay ${current ? "current" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`Bay ${d.number}: ${d.name}`}
              onClick={() => onGo({ kind: "bay", index: i })}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onGo({ kind: "bay", index: i })}
            >
              <rect x={p.x - p.w * 0.42} y={p.y - 26} width={p.w * 0.84} height="52" rx="2" />
              <text x={p.x} y={p.y - 4} className="map-bay-n">
                {d.number}
              </text>
              <text
                x={p.x}
                y={p.y + 12}
                className="map-bay-name"
                textLength={Math.min(p.w * 0.78, d.name.split(" ").at(-1)!.length * 4.6)}
                lengthAdjust="spacingAndGlyphs"
              >
                {d.name.split(" ").at(-1)!.toUpperCase()}
              </text>
            </g>
          );
        })}
        {roomRect("evolution", 34, 150, 104, 160, "EVOLUTION", "75 years · 75 s", "plain", { kind: "room", room: "evolution" })}
        {roomRect("hall", 742, 150, 116, 160, "CHAMPIONS", "Drivers' titles", "gold", { kind: "room", room: "hall" })}
        {roomRect("legacy", 866, 110, 102, 240, "LEGACY", "Constructors' titles", "red", { kind: "room", room: "legacy" })}
        {roomRect("theatre", 330, 398, 220, 50, "THEATRE", "Legendary Moments", "red", { kind: "theatre" })}
        {roomRect("machine", 580, 398, 150, 50, "THE MACHINE", "Engineering study", "plain", { kind: "machine" })}
        {/* Entrance. */}
        <g className="map-entrance">
          <line x1="40" x2="100" y1="390" y2="390" />
          <text x="70" y="410">ENTRANCE</text>
        </g>
        <g className="map-here" transform={`translate(${here.x} ${here.y})`} aria-hidden="true">
          <circle r="16" className="pulse" />
          <circle r="6" />
        </g>
      </svg>
      {/* The same destinations as a list, for keyboards and small screens. */}
      <nav className="museum-index" aria-label="Rooms">
        <button onClick={() => onGo({ kind: "room", room: "evolution" })}>Evolution room</button>
        <button onClick={() => onGo({ kind: "bay", index: where.bay })}>The garage</button>
        <button onClick={() => onGo({ kind: "room", room: "hall" })}>Hall of Champions</button>
        <button onClick={() => onGo({ kind: "room", room: "legacy" })}>Legacy room</button>
        <button onClick={() => onGo({ kind: "theatre" })}>Legendary Moments</button>
        <button onClick={() => onGo({ kind: "machine" })}>The Machine</button>
      </nav>
    </div>
  );
}
