import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Grid2X2,
  SlidersHorizontal,
  RotateCcw,
  Maximize2,
  Minimize2,
  Focus,
  X,
  BookOpen,
  Plus,
  Check,
  Gauge,
  Move,
  Layers,
  Sparkles,
  Play,
  ExternalLink,
} from "lucide-react";
import {
  drivers,
  eras,
  getHistory,
  getTotals,
} from "./data/drivers";
import { parts } from "./data/engineering";
import Modal from "./components/Modal";
import SceneBoundary from "./components/SceneBoundary";
import { usePreferences } from "./hooks/usePreferences";
import { getPortrait } from "./data/media";
import { carSourcesFor, resolveCar } from "./data/cars";
import { helmetDesignFor } from "./data/helmetDesigns";
import { anchorsFor } from "./3d/cars/anchors";
import { useMuseumStore } from "./stores/museumStore";
import { useMuseumCamera } from "./3d/camera/useMuseumCamera";
import { useTourStore, tourSteps } from "./features/guided-tour/tourStore";
import GuidedTour from "./features/guided-tour/GuidedTour";
const Garage = lazy(() => import("./scenes/Garage"));
const SeasonArchive = lazy(() => import("./components/SeasonArchive"));
type Dialog = "directory" | "settings" | "about" | "sources" | "ask" | null;
const disclaimer =
  "ROSSO is an independent, unofficial Formula 1 fan project. It is not affiliated with or endorsed by Ferrari S.p.A., Scuderia Ferrari, Formula 1 or the FIA.";
const pad = (n: number) => String(n).padStart(2, "0");
// A credited driver photo for HTML views (directory, 2D archive).
function Portrait({ driverId, className }: { driverId: string; className: string }) {
  const p = getPortrait(driverId);
  if (!p) return null;
  const [fx, fy] = p.focalPoint ?? [0.5, 0.3];
  return (
    <img
      className={className}
      src={p.src}
      alt={p.alt}
      title={p.credit.attribution}
      loading="lazy"
      decoding="async"
      style={{ objectPosition: `${fx * 100}% ${fy * 100}%` }}
    />
  );
}
function App() {
  const {
    entered,
    driverIndex: index,
    year,
    section,
    part,
    setYear,
    setPart,
    openStory,
    openEngineering,
    leave,
    resetView,
    exploded,
    isolate,
    setExploded,
    toggleIsolate,
    focusPart,
  } = useMuseumStore();
  const touring = useTourStore((s) => s.active);
  const tourStep = useTourStore((s) => tourSteps[s.stepIndex]);
  const startTour = useTourStore((s) => s.start);
  const stopTour = useTourStore((s) => s.stop);
  useMuseumCamera();
  const [dialog, setDialog] = useState<Dialog>(null),
    [details, setDetails] = useState(false),
    [query, setQuery] = useState(""),
    [era, setEra] = useState("All eras"),
    [answer, setAnswer] = useState(""),
    [focusMode, setFocusMode] = useState(false);
  const prefs = usePreferences();
  const driver = drivers[index];
  const history = getHistory(driver.id);
  const totals = getTotals(driver.id);
  const car = useMemo(() => resolveCar(driver, year), [driver, year]);
  const availableParts = useMemo(() => {
    const anchors = anchorsFor(car.spec);
    return parts.filter((p) => anchors[p.id]);
  }, [car]);
  const activePart = availableParts.find((p) => p.id === part);
  const portrait = getPortrait(driver.id);
  const previousIndex = (index + drivers.length - 1) % drivers.length;
  const nextIndex = (index + 1) % drivers.length;
  const titleRef = useRef<HTMLHeadingElement>(null);
  function selectDriver(i: number) {
    stopTour();
    useMuseumStore.getState().selectDriver(i);
    setDialog(null);
    setDetails(false);
    setFocusMode(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function beginTour() {
    setDialog(null);
    setDetails(false);
    setFocusMode(false);
    startTour();
  }
  function enter() {
    useMuseumStore.getState().enter();
    window.scrollTo({ top: 0, behavior: "instant" });
    setTimeout(() => titleRef.current?.focus({ preventScroll: true }), 50);
  }
  useEffect(() => {
    if (section === "engineering" && part && !availableParts.some((p) => p.id === part))
      setPart(availableParts[0]?.id ?? null);
  }, [section, part, availableParts, setPart]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusMode(false);
        setPart(null);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const fallback = (
    <div className="flat-scene">
      <div className="flat-ring" />
      <Portrait driverId={driver.id} className="flat-portrait" />
      <span className="eyebrow">THE DESIGN ARCHIVE</span>
      <strong>{car.officialName ?? car.spec.familyLabel}</strong>
      <span>{car.accuracyLabel}</span>
      <p>
        2D archive mode. Every driver story, season and engineering explanation
        remains available.
      </p>
    </div>
  );
  const shown = drivers.filter(
    (d) =>
      (era === "All eras" || d.era === era) &&
      d.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  return (
    <div
      className={`app ${entered ? "in-garage" : "landing"} ${focusMode ? "focus-mode" : ""} ${touring ? "tour-active" : ""} ${touring && !tourStep.showStory ? "tour-corridor" : ""}`}
    >
      <a className="skip-link" href="#main">
        Skip to experience
      </a>
      <header className="header">
        <button
          className="brand"
          aria-label="ROSSO home"
          onClick={() => {
            stopTour();
            leave();
            setFocusMode(false);
          }}
        >
          ROSSO
          <span className="brand-dot" />
        </button>
        <span className="header-caption">
          AN INDEPENDENT
          <br />
          EXPRESSION OF PASSION
        </span>
        <nav aria-label="Main navigation">
          <button
            className={entered && section === "story" ? "active" : ""}
            onClick={() => {
              enter();
              openStory();
            }}
          >
            The garage
          </button>
          <button onClick={() => setDialog("directory")}>Driver hall</button>
          <button
            className={section === "engineering" ? "active" : ""}
            onClick={() => {
              enter();
              openEngineering();
            }}
          >
            Engineering
          </button>
          <button onClick={() => setDialog("about")}>
            The project <ArrowUpRight size={13} />
          </button>
        </nav>
        <button
          className="settings-button"
          aria-label="Experience settings"
          onClick={() => setDialog("settings")}
        >
          <span className="status-dot" />
          <span>
            {prefs.flat
              ? "2D ARCHIVE"
              : prefs.quality === "high" && !prefs.mobile
                ? "HIGH QUALITY"
                : "PERFORMANCE"}
          </span>
          <SlidersHorizontal size={16} />
        </button>
      </header>
      <main id="main">
        <section
          className="experience"
          aria-label={entered ? "The interactive garage" : "Welcome to ROSSO"}
        >
          <div className="scene" aria-hidden={dialog ? true : undefined}>
            {prefs.flat ? (
              fallback
            ) : (
              <SceneBoundary
                onFailure={() => prefs.setFlat(true)}
                fallback={fallback}
              >
                <Suspense
                  fallback={
                    <div className="scene-loading">
                      <span />
                      Opening the garage…
                    </div>
                  }
                >
                  <Garage
                    driver={driver}
                    bay={index}
                    high={prefs.quality === "high" && !prefs.mobile}
                    landing={!entered}
                    engineering={entered && section === "engineering"}
                    onPart={focusPart}
                    exploded={exploded}
                    isolate={isolate}
                    selected={part}
                    explore={!prefs.mobile}
                    reduced={prefs.reduced}
                    onFailure={() => prefs.setFlat(true)}
                    onSelectDriver={selectDriver}
                    car={car}
                    helmet={helmetDesignFor(driver)}
                  />
                </Suspense>
              </SceneBoundary>
            )}
          </div>
          <div className="scene-shade" />
          {!entered ? (
            <>
              <div className="landing-copy">
                <div className="eyebrow">
                  <span className="tiny-line" />
                  1950 — PRESENT
                  <span className="eyebrow-secondary"> / MARANELLO, ITALY</span>
                </div>
                <h1>ROSSO</h1>
                <p className="landing-subtitle">
                  THE INTERACTIVE SCUDERIA FERRARI F1 GARAGE
                </p>
                <h2>
                  Every era.
                  <br />
                  One obsession.
                </h2>
                <p className="intro">
                  The drivers. The machines. The moments.
                  <br />
                  Step inside a story written in red.
                </p>
                <div className="landing-actions">
                  <button className="enter-button" onClick={enter}>
                    ENTER THE GARAGE
                    <span>
                      <ArrowRight size={21} />
                    </span>
                  </button>
                  <button className="tour-link" onClick={beginTour}>
                    <Play size={14} /> TAKE THE GUIDED TOUR
                  </button>
                </div>
                <div className="landing-note">
                  <span className="status-dot" />
                  AN INTERACTIVE 3D EXPERIENCE
                  <span className="note-line" />
                  BUILT FOR THE TIFOSI
                </div>
              </div>
              <div className="scene-caption">
                <span className="caption-rule" />
                <div>
                  <span className="eyebrow">A STUDY IN SPEED</span>
                  <p>Engineering becomes emotion.</p>
                  <span className="fine-print">
                    Original procedural car · inspired by the V10 era
                  </span>
                </div>
              </div>
              <div className="vertical-label">PASSIONE. SENZA FINE.</div>
              <div className="hero-bottom">
                <span>SCROLL TO DISCOVER THE COLLECTION</span>
                <span>
                  01 — 07 <span className="small-red">/</span> SEVEN ERAS. ONE
                  SCUDERIA.
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="garage-topline">
                <button
                  className="back-link"
                  onClick={() => {
                    stopTour();
                    leave();
                  }}
                >
                  <ArrowLeft size={13} /> THE GARAGE
                </button>
                <nav className="bay-stepper" aria-label="Move between driver bays">
                  <button
                    onClick={() => selectDriver(previousIndex)}
                    aria-label={`Previous bay: ${drivers[previousIndex].name}`}
                  >
                    <ChevronLeft size={18} />
                    <span className="bay-stepper-name">
                      {drivers[previousIndex].name.split(" ").at(-1)}
                    </span>
                  </button>
                  <span className="bay-stepper-current" aria-live="polite">
                    <strong>
                      BAY {driver.number}
                      <span> / {pad(drivers.length)}</span>
                    </strong>
                    <span className="bay-stepper-era">{driver.era}</span>
                  </span>
                  <button
                    onClick={() => selectDriver(nextIndex)}
                    aria-label={`Next bay: ${drivers[nextIndex].name}`}
                  >
                    <span className="bay-stepper-name">
                      {drivers[nextIndex].name.split(" ").at(-1)}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </nav>
                <button
                  className="directory-link"
                  onClick={() => setDialog("directory")}
                >
                  <Grid2X2 size={13} /> DRIVER DIRECTORY
                </button>
              </div>
              <div className="driver-copy" key={driver.id}>
                <div className="eyebrow">
                  <span className="tiny-line" />
                  {driver.era}
                </div>
                <h1 ref={titleRef} tabIndex={-1}>
                  {driver.name.split(" ").slice(0, -1).join(" ")}
                  <strong>{driver.name.split(" ").at(-1)}</strong>
                </h1>
                <div className="driver-meta">
                  <span
                    className={`flag flag-${driver.flag}`}
                    aria-hidden="true"
                  />
                  {driver.nationality}
                  <span>·</span>FERRARI {driver.ferrariYears}
                </div>
                <p className="tagline">{driver.tagline}</p>
                <p className="driver-summary">{driver.summary}</p>
                <div className="stats">
                  <div>
                    <strong>{pad(totals.wins)}</strong>
                    <span>WINS</span>
                  </div>
                  <div>
                    <strong>{totals.podiums}</strong>
                    <span>PODIUMS</span>
                  </div>
                  <div>
                    <strong>{driver.polesWithFerrari ?? "—"}</strong>
                    <span>POLES</span>
                  </div>
                  <div>
                    <strong>
                      {pad(driver.championshipsWithFerrari.length)}
                    </strong>
                    <span>TITLES</span>
                  </div>
                </div>
                <button
                  className="data-note"
                  onClick={() => setDialog("sources")}
                >
                  FERRARI GRAND PRIX RESULTS ONLY <ArrowUpRight size={11} />
                </button>
                {driver.era === "Present day" && (
                  <p className="snapshot-note">
                    Completed-2025 snapshot · excludes sprints
                  </p>
                )}
                <div
                  className="view-tabs"
                  role="tablist"
                  aria-label="Exhibit view"
                >
                  <button
                    role="tab"
                    aria-selected={section === "story"}
                    onClick={openStory}
                  >
                    THE STORY
                  </button>
                  <button
                    role="tab"
                    aria-selected={section === "engineering"}
                    onClick={() => openEngineering()}
                  >
                    THE MACHINE <Plus size={12} />
                  </button>
                </div>
              </div>
              <div className="car-label">
                <span className="eyebrow">{year} / CAR STUDY</span>
                <h2>{car.officialName ?? car.spec.familyLabel}</h2>
                <span>{car.accuracyLabel}</span>
              </div>
              <div className="scene-tools">
                <span>
                  <Move size={14} />
                  {prefs.flat
                    ? "2D ARCHIVE"
                    : prefs.mobile
                      ? "DRAG TO ROTATE · PINCH TO ZOOM"
                      : "DRAG TO ORBIT · SCROLL TO ZOOM"}
                </span>
                <button
                  className="icon-button"
                  aria-label="Reset car view"
                  onClick={resetView}
                >
                  <RotateCcw size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label={
                    focusMode ? "Exit focused car view" : "Focus on the car"
                  }
                  onClick={() => setFocusMode((v) => !v)}
                >
                  {focusMode ? <X size={18} /> : <Maximize2 size={17} />}
                </button>
              </div>
              {section === "engineering" && (
                <div className="engineering-panel">
                  <div className="eyebrow">
                    EXPLORE THE MACHINE{" "}
                    <span>{pad(availableParts.length)} COMPONENTS</span>
                  </div>
                  <div className="machine-controls">
                    <button
                      className="explode-button"
                      aria-pressed={exploded}
                      onClick={() => setExploded(!exploded)}
                    >
                      {exploded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                      {exploded ? "Collapse car" : "Explode car"}
                    </button>
                    <button
                      className="isolate-button"
                      aria-pressed={isolate}
                      disabled={!part}
                      onClick={toggleIsolate}
                      title="Show only the selected component"
                    >
                      <Focus size={15} /> Isolate
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Reset engineering view"
                      onClick={resetView}
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                  <div className="part-list">
                    {availableParts.map((p) => (
                      <button
                        key={p.id}
                        className={part === p.id ? "active" : ""}
                        aria-pressed={part === p.id}
                        onClick={() => focusPart(p.id)}
                      >
                        <span>{pad(parts.indexOf(p) + 1)}</span>
                        {p.name}
                        <Plus size={12} />
                      </button>
                    ))}
                  </div>
                  {activePart && (
                    <div className="part-detail" aria-live="polite">
                      <span className="eyebrow">{activePart.category}</span>
                      <h3>{activePart.name}</h3>
                      <p>{activePart.text}</p>
                      <span className="fine-print">
                        General principle · design varies by era
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {/* Mounted on every screen: the tour can start from the landing page. */}
          <GuidedTour mobile={prefs.mobile} />
        </section>
        {!entered ? (
          <section className="collection">
            <div className="section-heading">
              <div>
                <span className="eyebrow">THE COLLECTION</span>
                <h2>A legacy, in seven chapters.</h2>
              </div>
              <button
                className="text-link"
                onClick={() => setDialog("directory")}
              >
                MEET THE DRIVERS <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="era-grid">
              {[
                {
                  n: "01",
                  date: "1950—1969",
                  title: "Where it all began.",
                  caption: "THE PIONEERS",
                  i: 0,
                },
                {
                  n: "02",
                  date: "1970—1995",
                  title: "Courage. Without compromise.",
                  caption: "THE RACING SPIRIT",
                  i: 5,
                },
                {
                  n: "03",
                  date: "1996—2006",
                  title: "The making of a dynasty.",
                  caption: "THE SCHUMACHER ERA",
                  i: 10,
                },
              ].map((e) => (
                <button
                  className="era-item"
                  key={e.n}
                  onClick={() => selectDriver(e.i)}
                >
                  <div>
                    <span className="era-num">{e.n}</span>
                    <span className="eyebrow">{e.date}</span>
                    <ArrowUpRight size={20} />
                  </div>
                  <span className="eyebrow">{e.caption}</span>
                  <h3>{e.title}</h3>
                  <div className="era-bottom">
                    <span>EXPLORE THIS CHAPTER</span>
                    <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <Suspense
            fallback={
              <div className="archive-loading">Opening the season archive…</div>
            }
          >
            <SeasonArchive
              driver={driver}
              year={year}
              setYear={setYear}
              details={details}
              setDetails={setDetails}
              onStartTour={beginTour}
              index={index}
              selectDriver={selectDriver}
            />
          </Suspense>
        )}
      </main>
      <footer>
        <div className="footer-brand">
          ROSSO<span>PASSIONE, SENZA FINE.</span>
        </div>
        <p>{disclaimer}</p>
        <button onClick={() => setDialog("sources")}>
          SOURCES & CREDITS <ArrowUpRight size={12} />
        </button>
        <button onClick={() => setDialog("ask")} className="ask-button">
          <Sparkles size={14} /> ASK THE GARAGE <span>PREVIEW</span>
        </button>
      </footer>
      {dialog === "directory" && (
        <Modal
          title="The hall of drivers."
          kicker="17 STORIES / ONE SCUDERIA"
          onClose={() => setDialog(null)}
          wide
        >
          <p className="modal-intro">
            Move through the eras. Find your way into the story.
          </p>
          <div className="directory-filters">
            <input
              autoFocus
              aria-label="Search drivers"
              placeholder="Find a driver…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              aria-label="Filter by era"
              value={era}
              onChange={(e) => setEra(e.target.value)}
            >
              {["All eras", ...eras].map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>
          <div className="directory-list">
            {shown.map((d) => (
              <button
                key={d.id}
                className={d.id === driver.id ? "selected" : ""}
                onClick={() => selectDriver(drivers.indexOf(d))}
              >
                <span className="driver-number">{d.number}</span>
                <Portrait driverId={d.id} className="directory-portrait" />
                <div>
                  <span className="eyebrow">{d.era}</span>
                  <h3>{d.name}</h3>
                </div>
                <span className="directory-years">{d.ferrariYears}</span>
                <ArrowUpRight size={20} />
              </button>
            ))}
            {!shown.length && (
              <p className="empty">
                No drivers match. Try another name or era.
              </p>
            )}
          </div>
        </Modal>
      )}
      {dialog === "settings" && (
        <Modal
          title="Your experience."
          kicker="TUNED FOR YOUR MACHINE"
          onClose={() => setDialog(null)}
        >
          <p className="modal-intro">
            A little less rendering. Just as much passion.
          </p>
          <div className="settings-options">
            {[
              {
                id: "performance",
                icon: <Gauge size={23} />,
                title: "Performance",
                text: "Recommended. Capped resolution, soft baked-style shadows and no post-processing.",
              },
              {
                id: "high",
                icon: <Layers size={23} />,
                title: "High quality",
                text: "Higher resolution, antialiasing and a real-time directional shadow.",
              },
            ].map((q) => (
              <button
                key={q.id}
                className={prefs.quality === q.id ? "selected" : ""}
                onClick={() => prefs.setQuality(q.id as "performance" | "high")}
              >
                {q.icon}
                <div>
                  <h3>{q.title}</h3>
                  <p>{q.text}</p>
                </div>
                {prefs.quality === q.id && <Check size={20} />}
              </button>
            ))}
            <button
              className={prefs.flat ? "selected" : ""}
              onClick={() => prefs.setFlat(!prefs.flat)}
            >
              <BookOpen size={23} />
              <div>
                <h3>2D archive</h3>
                <p>
                  Disable 3D and keep exploring the drivers, seasons and
                  engineering.
                </p>
              </div>
              <span className="toggle-status">{prefs.flat ? "ON" : "OFF"}</span>
            </button>
          </div>
          <p className="fine-print">
            Mobile uses performance rendering automatically. Reduced-motion
            preferences are respected. Quality is saved only on this device.
          </p>
        </Modal>
      )}
      {dialog === "about" && (
        <Modal
          title="Made of passion."
          kicker="THE ROSSO PROJECT"
          onClose={() => setDialog(null)}
        >
          <p className="large-copy">
            A digital museum for the people who feel something when a red car
            takes to the track.
          </p>
          <p>
            ROSSO explores Ferrari’s Formula 1 story through its drivers, their
            seasons and the engineering behind the spectacle. It is an
            independent, non-commercial portfolio project.
          </p>
          <div className="about-grid">
            <div>
              <strong>17</strong>
              <span>SELECTED DRIVERS</span>
            </div>
            <div>
              <strong>07</strong>
              <span>CHAPTERS</span>
            </div>
            <div>
              <strong>01</strong>
              <span>SHARED PASSION</span>
            </div>
          </div>
          <h3>Original by design.</h3>
          <p>
            Every car in this prototype is made from original procedural
            geometry. Era variations are illustrative studies, not exact Ferrari
            models. There are no official logos, copied liveries or
            redistributed commercial assets.
          </p>
          <p className="disclaimer">{disclaimer}</p>
        </Modal>
      )}
      {dialog === "sources" && (
        <Modal
          title="Behind the archive."
          kicker="SOURCES & CREDITS"
          onClose={() => setDialog(null)}
        >
          <h3>{driver.name} · Ferrari period</h3>
          <p>
            Grand Prix wins and podiums are calculated from Ferrari-constructor
            race results in the Jolpica / Ergast archive, frozen through 31
            December 2025. They exclude sprint results and results for other
            teams.
          </p>
          <p>
            Race entries ({totals.entries}) include non-starts and are not
            labelled race starts. Shared drives count once per Grand Prix. Pole
            figures are shown only where separately sourced; a dash means not
            yet verified, never zero.
          </p>
          <div className="source-list">
            <a href={history.source} target="_blank" rel="noreferrer">
              Jolpica · {driver.name} Ferrari results <ExternalLink size={14} />
            </a>
            {driver.sources.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                {s.label}
                <ExternalLink size={14} />
              </a>
            ))}
            <a
              href="https://github.com/jolpica/jolpica-f1"
              target="_blank"
              rel="noreferrer"
            >
              Jolpica · dataset documentation <ExternalLink size={14} />
            </a>
          </div>
          {carSourcesFor(driver, year).length > 0 && (
            <>
              <h3>
                {year} car · {car.officialName}
              </h3>
              <div className="source-list">
                {carSourcesFor(driver, year).map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                    {s.publisher} · {s.title}
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>
            </>
          )}
          {portrait && (
            <>
              <h3>Portrait</h3>
              <div className="source-list">
                {portrait.credit.sourceUrl ? (
                  <a href={portrait.credit.sourceUrl} target="_blank" rel="noreferrer">
                    {portrait.credit.attribution}
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <p>{portrait.credit.attribution}</p>
                )}
              </div>
            </>
          )}
          <h3>Asset credits</h3>
          <p>
            Car, garage and helmets: original procedural geometry; helmets are
            abstract studies in national colours, not replicas. Icons: Lucide
            (ISC). Typography: locally bundled Barlow and Barlow Condensed (SIL
            Open Font License). Driver portraits come from Wikimedia Commons
            under the licence credited for each. No Ferrari logos or
            third-party car models are distributed with the project.
          </p>
          <p className="fine-print">
            Schumacher, Lauda and Vettel have editorial season-by-season
            exhibits. The other bays have reusable season archives and concise
            introductions. Present-day statistics are a dated snapshot, not a
            live feed.
          </p>
        </Modal>
      )}
      {dialog === "ask" && (
        <Modal
          title="Ask the garage."
          kicker="PHASE 2 / CONCEPT PREVIEW"
          onClose={() => setDialog(null)}
        >
          <p className="modal-intro">
            A future guide to the people and ideas behind the cars. For now,
            explore these curated answers. No AI service is connected.
          </p>
          <div className="question-list">
            {[
              {
                q: "What made Schumacher’s 2000 season special?",
                a: "Schumacher won nine Grands Prix and clinched the drivers’ championship at Suzuka. It was Ferrari’s first drivers’ title since Jody Scheckter in 1979. Explore Michael’s 2000 timeline entry and its sources for more.",
              },
              { q: "How does a front wing work?", a: parts[0].text },
              {
                q: "Are these actual Ferrari car models?",
                a: "No. These are original, generic open-wheel car studies. They can be replaced with licensed or user-provided models later.",
              },
            ].map((item) => (
              <button key={item.q} onClick={() => setAnswer(item.a)}>
                {item.q}
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
          {answer && (
            <div className="curated-answer" aria-live="polite">
              <span className="eyebrow">CURATED ARCHIVE NOTE</span>
              <p>{answer}</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
export default App;
