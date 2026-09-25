# ROSSO

**The Interactive Scuderia Ferrari F1 Garage**

An independent, non-commercial fan prototype built with React, TypeScript, Vite, Three.js, React Three Fiber and drei. It includes a cinematic entrance, an original procedural garage, seventeen driver archives, season timelines, guided camera navigation and nine engineering hotspots.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open the local address printed in the terminal, normally `http://127.0.0.1:5173`.

```sh
npm test        # Historical data reconciliation and boundary checks
npm run build  # TypeScript validation and production output
npm run preview
```

The production files are generated in `dist/`. No database, API key, GPU compute toolkit or backend is required. Fonts and historical data are bundled locally. The production site makes no third-party requests except when a visitor deliberately opens a source link.

## What is implemented

- Near-black cinematic landing, responsive museum interface and smooth camera focus changes.
- One original open-wheel car at a time; illustrative classic, V10/V8 and modern variations. These are generic studies, **not exact Ferrari models**.
- Complete Schumacher editorial timeline (1996–2006), followed by Lauda (1974–1977) and Vettel (2015–2020).
- All seventeen requested drivers have searchable, chronological directory entries, Ferrari-specific win/podium totals, championship years, per-season statistics and expandable race classifications.
- Important cars and memorable races appear in the expanded season archive.
- Separate present-day section for Leclerc and Hamilton, explicitly using a **completed-2025 snapshot**.
- Orbit, zoom, optional pan, guided next/previous driver controls, focused car view and reset.
- Nine projected car hotspots with matching accessible HTML controls and general engineering explanations.
- Performance/high-quality modes, reduced-motion handling, mobile simplification, a manual 2D archive and error/context-loss fallback.
- Ask the Garage is a clearly labelled curated-answer preview. No AI API is connected.
- Local, open-licensed fonts; no official logos, photography, commercial models or copied liveries.

The additional fourteen drivers are archive exhibits, not bespoke editorial experiences to the depth of Schumacher. Pole totals remain an explicit dash where not yet independently sourced. The garage is an orbit/pan museum prototype rather than a first-person walking simulator. There are no live 2026 statistics.

## The Evolution room

A room before the first bay plays Ferrari's cars from 1951 to 2026 on a turntable in 75 seconds (`src/features/evolution`). Each of the twenty cars is a real driver-season, so its name, livery, race number and engine come from the sourced data; each announces itself with a short synthesised rev. Open it from the landing page or the Evolution tab.

## The Hall of Champions

The corridor ends in a gilded room with a station for every Ferrari drivers' world champion: their helmet, one gold trophy per title and a plaque with years and cars (`src/features/hall`). The list comes from the sourced career titles, so it updates with the data. Choosing a title opens that driver's bay on the championship season.

## The Legacy room

Beyond the Hall of Champions, a red-lacquered room under a gilded "16" holds every constructors' championship (`src/features/legacy`). Points, wins and the drivers of each title season come from `scripts/fetch-constructors.mjs` (Jolpica, standings from 1958). Cars, team leadership, notes and the era trophy styles come from the researched `constructorsLegacy.json`, with sources. Trophies follow the research by era: flared silver FIA beakers to 1962; a deliberately generic cup for 1963–94, where no reliable record of the award was found; and from 1995 the tall silver constructors' vase and the drivers' trophy with its gold spiral. They are simplified interpretations, not replicas, and each season says which applies. The dream-team panel lists only the members the sources name explicitly.

## Room music

The Hall of Champions and the Legacy room each have calm generative music (slow pad chords, a soft bell melody and synthetic reverb) that fades in on arrival and out on leaving. It follows the sound switch.

## Legendary Moments

Six races replayed from the lap times recorded that day (`src/features/moments`): Barcelona 1996, Suzuka 2000, Magny-Cours 2004, Interlagos 2007, Monza 2019 and Barcelona 2026. `scripts/fetch-moments.mjs` bundles each race's classification and cumulative lap times (Jolpica) with a simplified circuit outline from bacinger/f1-circuits (MIT, today's layouts, checked to run in race direction). Positions are interpolated within each lap, so gaps are exact at the line. Captions are researched and sourced in `momentsResearch.json`. Open the theatre from the Moments tab, the landing page, or a matching season in a driver's bay.

## Sound

Sound is on by default and can be switched off in the header or settings; the choice is remembered on the device. Browsers start audio only after the first click or key press. Everything is synthesised with the Web Audio API (`src/audio`): a quiet garage room tone, soft transition and servo cues, and an engine note per car whose firing rhythm follows the sourced engine layout (cylinder count, turbo, hybrid). Engine notes are captioned as synthesised impressions, not recordings. No audio files are downloaded.

## Architecture

```text
src/
  App.tsx                    Layout, navigation and archive dialogs
  stores/
    museumStore.ts           Where the visitor is: driver, year, story/machine, part
  3d/camera/
    poses.ts                 Named, bay-relative camera poses
    cameraStore.ts           Camera requests and arrival events
    CameraDirector.tsx       The only code that moves the camera
    useMuseumCamera.ts       Maps museum state to a pose when not touring
  features/guided-tour/
    tourSteps.ts             Schumacher tour; narration derived from src/data
    tourStore.ts             Tour state machine (step, pause, skip, stop)
    GuidedTour.tsx           Stages steps, waits for camera arrival, tour card UI
  components/
    Modal.tsx                Native modal, keyboard dismissal and focus return
    SceneBoundary.tsx        3D error boundary
    SeasonArchive.tsx        Lazy-loaded timeline, race results and guided controls
  scenes/
    Garage.tsx               Lazy WebGL scene, lights and hotspot projection
    Car.tsx                  Original reusable procedural car geometry
  data/
    drivers.ts               Driver metadata, editorial timelines and sources
    history.json             Offline Ferrari-constructor results through 2025
    engineering.ts           Nine explanatory hotspots and their model positions
  hooks/
    usePreferences.ts        Quality, mobile and reduced-motion preferences
  styles.css                 Shared design tokens and responsive layouts
scripts/
  fetch-history.mjs          Reproducible, rate-limited data import
  data.test.mjs              Dataset reconciliation tests
```

### Design and UX

Near-black `#101112`, warm white `#ece8df`, racing-red accent `#e33a3f`; Barlow for interface text and Barlow Condensed for exhibit headings. The entrance leads into Schumacher’s bay. Visitors can select seasons, open race records, inspect engineering, or jump through the driver directory. Guided navigation is the mobile default. Native buttons, dialogs, visible focus states and a skip link support keyboard navigation; every 3D hotspot has an HTML alternative.

### Performance decisions

The renderer uses `frameloop="demand"`: it draws when controls, camera transitions, size or scene state changes rather than running an endless idle animation. Performance mode caps pixel ratio at 1, disables multisample antialiasing and real-time shadows, and uses a one-frame 256px contact-shadow texture. High mode caps pixel ratio at 1.5, enables antialiasing and one 1024px directional shadow, and uses a 512px contact shadow. Mobile forces the lighter rendering settings.

Only one car and three small reusable bay structures are mounted. Materials and custom geometry are shared within the car, and are disposed on unmount. There are no particles, real reflections, environment downloads or post-processing chains. Fonts are self-hosted and the 3D and season-view code is loaded separately. Orbit damping requests frames only while moving. The largest download is the Three.js/drei renderer bundle; this is a real 3D engine, not a lightweight image carousel.

The interface has been browser-tested at desktop and 390px/360px phone widths. These are functional/layout checks, not an FPS or memory benchmark on every integrated GPU. Performance mode is the recommended default.

### Replacing the car with a licensed GLB

Keep `CarProps` and the parent coordinate system. Replace the procedural content in `src/scenes/Car.tsx` with a `useGLTF`-based component under the existing Suspense boundary. The car points towards negative X; Y is up. Its length is approximately 5 units and width 2.5 units. Reposition `engineering.ts` hotspots for the replacement mesh.

Use a model whose licence permits the intended distribution. Keep its attribution alongside the asset. Prefer Meshopt/Draco where useful, textures at 1K (2K maximum), and one active model at a time. Do not preload all seventeen cars. The procedural model requires no compression, remote textures or licensing clearance from an asset vendor.

## Historical data and editorial limits

`history.json` is generated from [Jolpica / Ergast](https://github.com/jolpica/jolpica-f1) using the `drivers/{id}/constructors/ferrari/results/` filter. The import is capped at the date set in `scripts/fetch-history.mjs` (currently 25 September 2026). It is an offline snapshot, not a live service. Wins and podiums are calculated from the final GP classifications, excluding sprint results and other constructors. An entry can include a non-start and must not be presented as a race start. Shared drives count once per Grand Prix.

Ferrari/F1 primary-source links in `drivers.ts` support the core editorial exhibits and separately verified pole figures. Annual Formula 1 results are also linked. Schumacher’s 72 wins/116 podiums and Vettel’s 14 wins/55 podiums reconcile with Ferrari’s published archive. Hamilton’s China 2025 win is a **sprint** and does not inflate his 2025 Grand Prix wins.

To reproduce the snapshot, run `node scripts/fetch-history.mjs` with network access, then `npm test`. The script uses an identifying user-agent, honours pagination, retries transient failures and writes only after all driver imports succeed. Change `CUTOFF` deliberately and update the tests at the same time. Career-wide world titles, Ferrari pole counts and the current-season summary live in `src/data/careerStats.json`, each with sources.

## Deployment

This delivery is local; nothing has been published. To deploy later:

1. Run `npm ci`, `npm test`, and `npm run build`.
2. Upload only `dist/` to a static host, or configure a Git-connected static host with build command `npm run build` and output directory `dist`.
3. Use HTTPS, compression and long-lived caching for hashed assets. Serve `index.html` with revalidation.
4. For hosting under a subdirectory, set Vite’s `base` to the intended path and rebuild.
5. Check the deployed landing, 3D load, directory, timeline, settings and phone layout. Keep the unofficial-project disclaimer visible.

No server routes or SPA rewrite rules are required because this version uses a single page. Do not upload `node_modules`, development logs or private environment files. For Sites hosting, register the project and point the static output to `dist` when publication is requested.

### Future Ask the Garage integration

Add a server/serverless endpoint that retrieves this sourced archive, validates questions and returns source-backed answers. Keep all API credentials on the server, apply request limits, and label generated answers. Never put a secret in a `VITE_*` variable: these are compiled into public JavaScript. The current curated preview has no network/API dependency.

## Credits and disclaimer

Geometry, garage, cars, helmets and interface: original project work. Cars are procedural, historically informed studies built from era families (`src/3d/cars`); season-to-car names come from `src/data/carsByYear.json`, where every entry cites Ferrari, Formula 1 or another listed source. Liveries (`src/data/liveries.json`) give each car its researched paint zones, race numbers and sponsor names; sponsor names are set as plain type, not reproduced logo artwork, and each entry records its sources and a confidence level. Helmets reproduce each driver's Ferrari-era colour scheme and layout (`src/data/helmetDesigns.json`, with references) without sponsor marks. Driver portraits: Wikimedia Commons, each under its own licence (public domain, CC0, CC BY or CC BY-SA); the creator, licence and source page for every photo are recorded in `src/data/portraits.json` and shown under Sources & credits. Portraits shown in greyscale or cropped are adaptations of those files. No team logo is distributed; an owner may add one locally at `src/assets/brand/team-emblem.svg` (git-ignored). Icons: [Lucide](https://lucide.dev/license), ISC. Typography: [Barlow](https://github.com/jpt/barlow), SIL Open Font License, bundled via Fontsource. Source data: Jolpica / Ergast. Historical source links are references, not an endorsement or a licence to reuse source-site images.

ROSSO is an independent, unofficial Formula 1 fan project. It is not affiliated with or endorsed by Ferrari S.p.A., Scuderia Ferrari, Formula 1 or the FIA.
