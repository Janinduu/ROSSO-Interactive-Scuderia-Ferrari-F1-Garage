# ROSSO — Interactive Scuderia Ferrari F1 Garage
## Master Product, UX, 3D, Data, Asset, Performance, and Development Specification

**Status:** V2 master specification  
**Purpose:** Single source of truth for ChatGPT Work, Codex, Claude Code, Antigravity, and human development  
**Project type:** Unofficial, non-commercial Formula 1 fan/portfolio experience  
**Primary platform:** Desktop web  
**Secondary platform:** Mobile/tablet simplified experience  
**Core stack:** React + TypeScript + Vite + Three.js / React Three Fiber  
**Priority order:** Experience quality → factual accuracy → performance → maintainability → feature count

---

# 0. How AI coding agents should use this document

This file is the product specification and development contract for ROSSO.

Any coding agent working on the repository must:

1. Read this file before making architectural changes.
2. Preserve the existing working implementation unless a change is required by this specification.
3. Prefer incremental pull-request-sized changes over full rewrites.
4. Keep the application runnable after each task.
5. Never invent Ferrari/F1 statistics, car names, race results, driver years, or technical specifications.
6. Never silently add unlicensed copyrighted media or 3D assets.
7. Prefer reusable systems over one-off hard-coded pages.
8. Optimize for a normal laptop with integrated graphics.
9. Keep the 2D archive usable even when WebGL is unavailable.
10. Treat the "garage" as a museum experience, not a dashboard with a decorative 3D object.
11. If uncertain about an historical fact, create a `TODO: verify source` rather than guessing.
12. Do not expose any OpenAI API key or other secret in client-side code.

The desired outcome is not "a Three.js demo."  
The desired outcome is **a cinematic, interactive digital museum about Ferrari in Formula 1**.

---

# 1. Product vision

## 1.1 North-star idea

ROSSO should feel like entering a private, after-hours Formula 1 museum.

The user enters a long, dark Ferrari-inspired garage divided into historical chapters. Each driver has a physical bay in the space. The bay is identifiable before the user enters it through:

- driver name
- portrait
- years with Ferrari
- era/chapter label
- a stylized helmet display
- a subtle visual clue for the representative car
- a short one-line historical hook

The full 3D car should **not** be loaded for every driver at once.

When the visitor selects or approaches a driver bay:

1. the rest of the garage falls back visually,
2. the selected bay illuminates,
3. the driver portrait and story become prominent,
4. a historically appropriate representative Ferrari F1 car prototype loads,
5. the user can orbit/inspect it,
6. the user can enter "Machine" mode,
7. the car can transition into an engineering/exploded view,
8. clickable components explain the engineering,
9. a season timeline lets the user switch years,
10. the representative car can change to match the selected year when an appropriate model exists,
11. race/career information appears below without covering the car,
12. the visitor can continue manually or use a working Guided Tour.

The long-term experience flow is:

**Garage → Driver → Season → Car → Engineering / Exploded View → Race → Circuit / Telemetry → Ask the Garage**

V1 does not need to implement the full telemetry/AI stage, but the architecture should leave room for it.

---

# 2. Why the current build is a good foundation, but not yet the target

The current version already has several strong foundations:

- dark visual identity
- clear ROSSO branding
- chronological "chapters"
- a driver directory
- a functioning Schumacher story view
- season timeline
- driver statistics
- basic machine hotspots
- performance/high-quality/2D modes
- legal disclaimer
- a sensible project/about modal

The problem is not that the build is bad.  
The problem is that the **3D environment currently feels secondary to the UI**, while ROSSO needs the physical museum experience to be the hero.

## 2.1 Current gaps to address

### A. All cars feel like one generic procedural car
The same basic car silhouette is currently reused. This breaks the historical illusion.

**Required change:** use era/year-specific representative car prototypes with distinct architecture and proportions.

### B. Garage bays are not yet meaningful physical destinations
Only one car is visibly present and other drivers do not yet feel represented in the world.

**Required change:** every driver gets a visible lightweight bay marker even when their car is not loaded.

### C. No driver portrait presence in the actual garage
The driver directory works, but a museum should visually connect the physical space with the driver.

**Required change:** each bay contains a portrait panel / media frame.

### D. Helmets are missing
Helmets are one of the most emotional and recognizable ways to identify drivers.

**Required change:** include a helmet pedestal in every driver bay. Use exact livery only when usage rights allow; otherwise use historically inspired / era-specific stylized helmets.

### E. "The Machine" is currently hotspots, not an engineering experience
Clickable dots are useful, but the car remains intact.

**Required change:** add an exploded-view state with controlled part separation.

### F. Guided Tour currently does not work
This is a core navigation mode and must become deterministic.

**Required change:** implement it as a state machine / tour controller instead of a collection of loosely connected camera animations.

### G. Tiny labels are difficult to read
The current micro typography fits the aesthetic but is below practical readability in several places.

**Required change:** raise minimum text size, contrast, line-height, and spacing while keeping the premium visual language.

### H. The garage needs more depth and atmosphere
The space looks like a stylized stage rather than a living museum.

**Required change:** improve scale, floor reflections, light pools, materials, wall geometry, spatial landmarks, room-to-room transitions, and sound design — without heavy rendering.

### I. Driver detail and garage mode are too visually similar
The same layout persists, making "entering a bay" feel less transformative than it should.

**Required change:** use three clearly distinct visual states:
- overview/exploration
- driver focus
- engineering focus

---

# 3. Experience principles

## 3.1 Premium, not flashy
The experience should feel restrained and confident.

Use:
- near black
- charcoal
- warm off-white
- restrained Ferrari-inspired red accents
- metallic grey
- very subtle gold/brass for championship moments only

Avoid:
- excessive neon
- red everywhere
- arcade HUD styling
- glassmorphism on every surface
- constant motion
- giant gradients
- excessive particles

## 3.2 Museum before dashboard
Statistics should support storytelling. They should not dominate the screen.

## 3.3 Physical place before page navigation
The user should feel that clicking a driver moves them to a real location in the museum.

## 3.4 Progressive disclosure
Do not show every detail at once.

Garage level:
- name
- portrait
- years
- one sentence
- helmet

Driver level:
- story
- representative car
- career stats
- season timeline

Engineering level:
- component labels
- exploded view
- technical explanation

Deep history level:
- season results
- car details
- important races
- source citations

## 3.5 Performance is part of the design
Do not solve presentation problems by loading more geometry, bigger textures, or heavier post-processing.

---

# 4. Information architecture

Top-level navigation:

- **The Garage**
- **Driver Hall**
- **Engineering**
- **The Project**
- **Performance / Quality**
- Future: **Race Lab**
- Future: **Ask the Garage**

The user should always know:
- where they are,
- which driver is selected,
- which era is active,
- how to return to the garage,
- how to jump to another driver.

---

# 5. Historical chapter structure

Use seven chapters as the spatial backbone.

A recommended organization:

## Chapter 01 — The Pioneers
Approx. 1950–1969

Initial selected drivers:
- Alberto Ascari
- Juan Manuel Fangio
- Mike Hawthorn
- Phil Hill
- John Surtees

Visual direction:
- warmer material tones
- archival display styling
- brushed metal
- subtle monochrome photography treatment
- cars with narrow bodies, exposed wheels, simpler aero

## Chapter 02 — Racing Spirit
Approx. 1970–1989

Drivers:
- Niki Lauda
- Gilles Villeneuve
- Jody Scheckter
- Nigel Mansell

Visual direction:
- stronger mechanical/analog identity
- exposed engineering diagrams
- period-style timing typography used carefully
- wider rear tyres / changing wing architecture

## Chapter 03 — Transition
Approx. 1990–1995

Drivers:
- Alain Prost
- optional later additions such as Jean Alesi / Gerhard Berger

This chapter can be visually compressed in V1 if needed.

## Chapter 04 — The Schumacher Era
1996–2006

Driver:
- Michael Schumacher

Future supporting drivers:
- Eddie Irvine
- Rubens Barrichello

This is the most developed V1 chapter and serves as the reference-quality bay.

## Chapter 05 — World Champions / Post-Schumacher
2007–2014

Drivers:
- Kimi Räikkönen
- Fernando Alonso

Potential later additions:
- Felipe Massa

## Chapter 06 — Modern Ferrari
2015–2024

Drivers:
- Sebastian Vettel
- Carlos Sainz
- Charles Leclerc (early/modern period as applicable)

## Chapter 07 — Present Day
Current era

Drivers:
- Charles Leclerc
- Lewis Hamilton

Current-season information must always be verified before publication.

---

# 6. Driver roster strategy

The initial product can retain the 17-driver list already used by the prototype:

1. Alberto Ascari
2. Juan Manuel Fangio
3. Mike Hawthorn
4. Phil Hill
5. John Surtees
6. Niki Lauda
7. Gilles Villeneuve
8. Jody Scheckter
9. Nigel Mansell
10. Alain Prost
11. Michael Schumacher
12. Kimi Räikkönen
13. Fernando Alonso
14. Sebastian Vettel
15. Carlos Sainz
16. Charles Leclerc
17. Lewis Hamilton

Important:
- This is a curated set, not "all Ferrari F1 drivers."
- UI copy should use terms such as **Selected Drivers**, **17 Stories**, or **Curated Driver Hall**.
- Do not imply this list is exhaustive.

---

# 7. The physical garage

## 7.1 Spatial model

The garage should be a continuous 3D environment divided into seven connected zones.

Suggested shape:
- long central path
- bays on alternating left/right walls
- occasional wider "hero rooms" for major eras
- subtle threshold lighting between chapters
- ceiling and floor lines guiding movement

Avoid a huge open hangar with every bay visible simultaneously.

## 7.2 What exists in every unloaded bay

Every bay should be lightweight and visible even when its full car is not loaded.

Each bay contains:

- driver name, large enough to read from the corridor
- driver portrait panel
- nationality marker
- Ferrari years
- chapter / era label
- one-sentence hook
- helmet pedestal or helmet silhouette
- empty/covered car plinth or luminous floor outline
- "Enter Bay" interaction
- optional year markers on the wall
- subtle car silhouette graphic

This means the museum never feels empty even though only one detailed car is loaded at a time.

## 7.3 Bay interaction states

### State 1 — Distant
Only:
- name
- portrait
- era marker
- low-intensity accent lighting

### State 2 — Hover / Nearby
Increase:
- portrait brightness
- name contrast
- helmet pedestal light
- short hook visibility
- subtle ambient sound cue

### State 3 — Selected
- camera transitions to bay
- background bays dim
- full driver content appears
- representative car asset lazy-loads
- loading indicator appears inside plinth area, not as a full-screen spinner
- driver story panel opens
- orbit controls become available when transition finishes

### State 4 — Machine mode
- UI simplifies
- component labels appear
- car rotates to default technical angle
- selected component highlights

### State 5 — Exploded mode
- parts separate along authored vectors
- camera eases outward
- labels reposition
- component list becomes active
- reset button becomes obvious

---

# 8. Driver portraits

## 8.1 Yes — add a driver image to every bay

This should be considered a core feature, not an optional decoration.

A physical museum without recognizable driver imagery will feel sterile.

Recommended treatment:
- vertical portrait
- grayscale / slightly desaturated in the corridor
- color or warmer treatment when selected
- subtle crop animation on focus
- no giant poster covering the whole bay
- portrait should not compete with the car

## 8.2 Asset licensing rule

Preferred sources:
1. images with explicit reuse licensing from Wikimedia Commons,
2. user-owned/licensed images,
3. official press/media assets only if their published usage terms permit this use.

For each image store:
- asset id
- local file path
- photographer/creator
- source page
- license
- attribution string
- date downloaded
- whether derivative/crop is allowed

Do not copy a random image from Google Images.

## 8.3 Suggested image data structure

```ts
type MediaCredit = {
  creator?: string
  sourceUrl: string
  license: string
  attribution: string
  originalFileUrl?: string
}

type DriverPortrait = {
  src: string
  alt: string
  credit: MediaCredit
  focalPoint?: [number, number]
}
```

---

# 9. Helmets

## 9.1 Role in the experience

Each driver bay should have a small helmet pedestal because helmets:
- identify the driver emotionally,
- give the bay a physical collectible,
- work even before the heavy car asset loads,
- can become the interaction point for opening the driver's timeline.

## 9.2 Licensing approach

Three levels:

### Level A — Licensed exact helmet
Use when you have explicit rights / compatible license.

### Level B — Historically inspired stylized helmet
Same broad era/color language, but no exact sponsor graphics or copied livery.

### Level C — Abstract helmet
Use a common helmet model with:
- driver color palette,
- year label,
- abstract striping,
- name/initial.

Level B or C is safer for the portfolio prototype.

## 9.3 Interaction
Clicking helmet can:
- focus camera on the helmet,
- open "Driver Identity" mini-panel,
- reveal years / championship markers,
- offer "Enter story."

Do not make helmet click the only way to access the driver.

---

# 10. Car strategy — historically appropriate, not one car for everyone

## 10.1 The rule

The application should not use one identical car mesh for every driver.

However, the project also should not claim to contain exact Ferrari CAD.

Use the wording:

**"Historically informed 3D interpretation"**  
or  
**"Era-accurate interactive prototype"**

unless a genuinely licensed exact model is used.

## 10.2 Three asset tiers

### Tier 1 — Hero year models
High attention, distinct silhouette, authored exploded parts.

Examples for initial development:
- Michael Schumacher — F2004-inspired / historically informed F2004 study
- Niki Lauda — 312T-era study
- Sebastian Vettel — SF71H-era study

These are the quality references.

### Tier 2 — Era family models
A reusable architecture for several adjacent years with:
- different front wing
- nose
- sidepod
- rear wing
- wheelbase/proportion presets
- tyre dimensions
- cockpit/halo state
- airbox
- engine cover

### Tier 3 — Placeholder silhouette
Used only until a proper era model exists.

Never present Tier 3 as an exact historical car.

## 10.3 Change car by year

The selected driver should have a `carsByYear` mapping.

Example for Schumacher (to be verified against authoritative sources before shipping):

```ts
carsByYear: {
  1996: "F310",
  1997: "F310 B",
  1998: "F300",
  1999: "F399",
  2000: "F1-2000",
  2001: "F2001",
  2002: "F2002",
  2003: "F2003-GA",
  2004: "F2004",
  2005: "F2005",
  2006: "248 F1"
}
```

This is exactly the behavior we want:
- choose 2004 → F2004 representation loads,
- choose 2000 → F1-2000 representation loads,
- camera and UI stay stable,
- only the car asset changes.

For years where a bespoke model does not exist yet:
- load the nearest correct era family prototype,
- display **"Era representation — exact year model in development"**.

## 10.4 Historical geometry research

For each car/year, document:
- year
- official car name
- wheel count / tyre form
- exposed/cowled body proportions
- front wing architecture
- rear wing architecture
- nose style
- sidepod form
- cockpit / halo state
- airbox
- engine-era label
- approximate length/width if verified
- distinctive design cues
- source references

Official Ferrari history/garage pages should be a primary source for historical car naming and specifications.

---

# 11. 3D car implementation

## 11.1 Recommended GLB structure

Each car model should use named nodes where possible:

```text
car_root
├── chassis
├── nose
├── front_wing
│   ├── mainplane
│   └── endplates
├── rear_wing
├── sidepod_left
├── sidepod_right
├── floor
├── diffuser
├── cockpit
├── steering_wheel
├── tyre_fl
├── tyre_fr
├── tyre_rl
├── tyre_rr
├── brake_fl
├── brake_fr
├── power_unit_proxy
└── suspension_groups
```

Exact groups can vary by era.

## 11.2 LOD strategy

Each car should ideally provide:
- `preview.glb`
- `detail.glb`

Optional:
- `exploded.glb` only if needed

The corridor should never load `detail.glb`.

## 11.3 Lazy-loading rule

At any time:

- corridor: no detailed car
- hover: optional static thumbnail / low-poly silhouette
- selected driver: one detailed car
- engineering view: current detailed car + technical helpers only
- leaving bay: dispose previous driver-specific car if memory pressure warrants it

Cache at most the current car and one adjacent/preloaded car.

---

# 12. Exploded car view

## 12.1 This is a core feature

"Machine" mode should not stop at hotspots.

Add a button:

**EXPLODE CAR**

When clicked:
- chassis remains centered
- front wing moves forward
- rear wing moves rearward/up
- wheels move outward
- sidepods move laterally
- floor lowers slightly
- power-unit proxy rises or shifts rearward
- steering wheel moves upward/front
- brake assemblies become visible
- optional translucent airflow guides appear

## 12.2 Do not implement physical simulation
Exploded view should be deterministic authored animation.

Use:
- GSAP timeline,
- react-spring,
- or a custom R3F animation controller.

Store exploded offsets in metadata:

```ts
type ExplodedPart = {
  nodeName: string
  positionOffset: [number, number, number]
  rotationOffset?: [number, number, number]
  labelAnchor?: [number, number, number]
}
```

## 12.3 Component categories

Support at minimum:
- Front wing
- Rear wing
- Tyres
- Brakes
- Steering wheel
- Floor
- Diffuser
- Sidepods
- Suspension
- Power unit

For older cars, not all components should be described using modern terminology without context.

## 12.4 Technical content rule

The explanation should distinguish:
- universal F1 engineering principle
- era-specific implementation
- car-specific verified fact

Example:

> **General principle:** The diffuser expands airflow exiting under the floor to help sustain low pressure beneath the car.  
> **Era note:** The geometry and floor regulations differed significantly in 2004 from current ground-effect cars.  
> **Car-specific:** Only include a claim if sourced.

---

# 13. Driver detail experience

When a driver is selected, the page should have three layers.

## 13.1 Layer 1 — Identity
- portrait
- name
- nationality
- Ferrari years
- era
- short sentence
- Ferrari-specific headline stats

## 13.2 Layer 2 — Story
A concise editorial narrative:
- arrival
- defining period
- major success or challenge
- relationship to Ferrari history
- departure / legacy

Do not turn this into a long Wikipedia article.

## 13.3 Layer 3 — Season timeline
Each year:
- car
- Ferrari wins that year for the driver
- podiums
- poles
- championship finish
- notable races
- short season line

Selected year updates:
- car
- year story
- result list
- engineering notes
- hero moment

## 13.4 Statistics labeling

Always distinguish:
- career total
- Ferrari-only total
- season-only total

Never show a number without clearly defining its scope.

---

# 14. Race result section

The current Grand Prix classification table is useful but visually dense.

Improve by:
- grouping into rounds,
- making position badges readable,
- allowing "Highlights only" default,
- "Full season" expansion,
- showing DNS/DNF/DSQ meanings via tooltip,
- avoiding three ultra-wide columns on smaller screens.

Suggested default:

**Season Highlights**
- 5–8 most important races

Then:
`View all 18 races`

---

# 15. Engineering mode

Engineering should feel like changing rooms from museum storytelling to technical study.

## 15.1 Visual changes
- reduce editorial copy
- darken background
- camera slightly closer
- reveal technical grid
- component list
- subtle section lines
- car centered larger

## 15.2 Interactions
- orbit
- zoom limits
- reset view
- explode/collapse
- isolate component
- highlight
- transparency / x-ray toggle where appropriate
- component description
- general/era/car-specific tabs

## 15.3 Do not overload
No more than one technical panel open at once.

---

# 16. Guided Tour — required redesign

Guided Tour is not a button that starts miscellaneous animations.

It should be a finite sequence controlled by one tour controller.

## 16.1 Tour controller state

```ts
type TourStep =
  | "intro"
  | "chapter_intro"
  | "approach_bay"
  | "driver_identity"
  | "driver_story"
  | "car_reveal"
  | "engineering_demo"
  | "season_moment"
  | "exit_bay"
  | "next_driver"
  | "complete"
```

Recommended central store:
- Zustand
- or a small reducer/state machine

## 16.2 Each tour step defines

```ts
type TourStepDefinition = {
  id: string
  driverId?: string
  cameraTarget: CameraPose
  durationMs: number
  uiMode: UIMode
  narration?: string
  action?: "loadCar" | "explodeCar" | "selectSeason" | "collapseCar"
  allowSkip: boolean
}
```

## 16.3 Rules
- camera animation must finish before the next dependent action
- user can pause
- user can exit tour at any time
- user can skip step
- manual orbit is disabled only while a camera transition is actively running
- route changes must not reset tour unexpectedly
- ESC stops tour safely
- reduced-motion users get instant/simplified transitions

## 16.4 V1 tour scope

Do not attempt all 17 drivers first.

Build one excellent mini-tour:
1. intro
2. walk into Schumacher era
3. enter Schumacher bay
4. show portrait/identity
5. reveal F2004
6. show one engineering component
7. show 2004 season moment
8. return to corridor
9. end

Once stable, generalize.

---

# 17. Camera system

Create a reusable `CameraDirector`.

Responsibilities:
- transition between known poses
- handle interruption
- blend orbit controls
- maintain focus target
- apply reduced-motion behavior
- support guided tour
- support driver directory jumps
- support reset view

Do not let individual components independently animate the camera.

Example pose data:

```ts
type CameraPose = {
  position: [number, number, number]
  target: [number, number, number]
  fov?: number
}
```

Named poses:
- `garageOverview`
- `chapter01Entrance`
- `schumacherApproach`
- `schumacherIdentity`
- `schumacherCar`
- `schumacherEngineering`
- etc.

---

# 18. Typography and readability

The current build uses stylish micro-labels too aggressively.

## 18.1 Minimum practical sizes

Desktop recommendation:
- tiny metadata: 11–12 px minimum
- normal supporting text: 14–16 px
- body: 16 px preferred
- navigation: 13–15 px
- major driver name: responsive clamp
- line-height: 1.4–1.65 for paragraphs

Avoid text below 11 px except nonessential decorative marks.

## 18.2 Contrast
Do not use low-opacity grey for critical information.

Use:
- high contrast for selectable / actionable text
- medium contrast for secondary metadata
- low contrast only for decorative labels

## 18.3 Font loading
- self-host WOFF2 when license permits
- subset fonts
- preload only primary weights
- avoid too many weights
- use system fallback immediately

---

# 19. Sound design

Optional, but valuable.

Use very subtle sound:
- room tone
- distant workshop ambience
- soft servo/mechanical sound when car rotates/explodes
- muted transition cue between chapters
- no looping engine roar by default

Rules:
- default can be muted if browser policies require
- visible sound control
- honor reduced motion / accessibility preferences
- never autoplay aggressive audio

---

# 20. Performance architecture

Target:
- ordinary laptop
- integrated graphics
- 16 GB RAM class machine
- desktop browser
- no CUDA
- no local AI inference

## 20.1 Performance mode

Default for unknown/low-power devices.

- DPR cap around 1–1.25
- minimal shadows
- no SSAO
- minimal bloom or none
- low-cost environment map
- no volumetric effects
- low-poly corridor props
- compressed textures
- 1K textures preferred

## 20.2 High-quality mode

- DPR up to around 1.5–2 depending on measured performance
- better antialiasing
- one directional shadow where useful
- higher environment quality
- subtle post-processing only

## 20.3 Auto-detection
Consider a short quality heuristic:
- device pixel ratio
- viewport
- WebGL renderer info if available
- frame-time sampling in first seconds

Never hard-code "mobile = bad".

## 20.4 Runtime budgets

Suggested V1 targets:
- initial JS compressed: keep aggressively reasonable
- initial 3D scene: under ~10–15 MB if practical
- individual detailed car: aim ~2–8 MB compressed
- driver portrait: optimized AVIF/WebP
- avoid loading 17 portraits at full resolution simultaneously
- route/chapter code split

These are goals, not absolute rules.

## 20.5 Dispose resources
On car unload:
- dispose geometries/materials/textures when they will not be reused
- revoke object URLs if used
- cancel pending async loads where practical

---

# 21. 2D Archive mode

This should not be a "failure mode."

It should be a clean parallel experience:
- driver portraits
- timelines
- car illustrations/renders
- engineering diagrams
- season results
- sources

Users can switch to 2D manually.

If WebGL fails:
- automatically offer 2D mode
- preserve selected driver/year in state

---

# 22. Mobile strategy

Mobile should not copy desktop free-roam navigation.

Use:
- guided chapter cards
- swipe between drivers
- simplified car viewer
- fewer effects
- portrait cards
- no complex first-person movement
- car auto-rotate optional
- engineering list opens fullscreen
- larger tap targets

---

# 23. Data architecture

Use structured data rather than embedding historical facts in JSX.

## 23.1 Driver model

```ts
type Driver = {
  id: string
  name: string
  firstName: string
  lastName: string
  nationality: string
  countryCode?: string

  ferrariYears: number[]
  ferrariYearLabel: string
  chapterId: string

  portrait: DriverPortrait
  helmet?: HelmetAsset

  summary: string
  longStory: string

  ferrariStats: {
    starts?: number
    wins?: number
    podiums?: number
    poles?: number
    titles?: number
  }

  seasons: DriverSeason[]
  sources: SourceRef[]
}
```

## 23.2 Season model

```ts
type DriverSeason = {
  year: number
  carId: string
  championshipPosition?: number
  wins?: number
  podiums?: number
  poles?: number
  notableRaces: RaceMoment[]
  narrative: string
  sourceIds: string[]
}
```

## 23.3 Car model

```ts
type Car = {
  id: string
  officialName: string
  year: number

  representationType:
    | "licensed_exact"
    | "historically_informed"
    | "era_family"
    | "placeholder"

  previewModel: string
  detailModel?: string

  dimensions?: {
    lengthMm?: number
    widthMm?: number
    wheelbaseMm?: number
  }

  engine?: string
  gearbox?: string

  visualFeatures: string[]
  components: CarComponent[]
  explodeConfig?: ExplodeConfig

  sources: SourceRef[]
}
```

## 23.4 Source model

```ts
type SourceRef = {
  id: string
  title: string
  publisher: string
  url: string
  accessedAt: string
  scope: "driver" | "season" | "car" | "race" | "media"
}
```

---

# 24. Factual sources

Prioritize sources in this order:

1. **Ferrari official history / Formula 1 / museum / garage pages**
2. **Formula1.com official driver/team/history pages**
3. **FIA documents** where appropriate
4. **Jolpica F1** for structured historical results
5. **FastF1** for programmatic analysis where appropriate
6. **OpenF1** for detailed recent telemetry, timing, and car data (mainly future Race Lab)

Do not use fan wikis as the only source for important claims.

Historical names and representative cars should be checked against Ferrari's own garage/history archive where possible.

---

# 25. Future telemetry / Race Lab

Do not build this before the museum works.

Future flow:

**Driver → Race → Circuit → Telemetry**

Potential data:
- speed
- throttle
- brake where available
- RPM
- gear
- intervals
- lap times
- position
- weather/session timing

For recent seasons, OpenF1 can support a later telemetry experience.  
For broader historical results, Jolpica/FastF1 are more appropriate.

The Race Lab should visually distinguish measured telemetry from editorial interpretation.

---

# 26. "Ask the Garage" future AI feature

V1 can keep this as Preview.

Later architecture:

Frontend:
- question input
- context chips: driver / year / car / race
- streamed answer
- source references

Backend:
- serverless function
- secure OpenAI API key
- context retrieval from curated data
- optional telemetry analysis

The assistant must ground answers in:
- project data,
- source records,
- telemetry when available.

Do not let it fabricate F1 history.

Possible questions:
- "Why was the F2004 so effective?"
- "What changed between Schumacher's 2000 and 2004 cars?"
- "Show me Vettel's strongest Ferrari season."
- "Explain the diffuser on this era of car."
- future: "Where did Driver A gain time in Sector 2?"

---

# 27. Asset sourcing

## 27.1 Driver images
Preferred:
- Wikimedia Commons assets with compatible licenses
- user-owned media
- clearly licensed editorial/press assets

Every file requires recorded attribution metadata.

## 27.2 3D environment assets
Safe starting point:
- custom procedural geometry
- original modeling
- CC0 environment/textures
- Poly Haven for CC0 HDRIs/materials/3D assets where suitable

## 27.3 3D cars
Be careful.

Options:
1. build original historically informed low-poly models,
2. commission / create models,
3. use permissively licensed downloadable models with attribution,
4. buy a license that explicitly permits use in an interactive portfolio.

Sketchfab can contain downloadable Creative Commons assets, but licenses vary per model and attribution requirements must be followed.

Do not commit commercial/editorial assets into a public repository unless their license allows redistribution.

For paid/restricted assets:
- add to `.gitignore`
- document how the owner places them locally
- provide placeholder fallback

---

# 28. Copyright / trademark position

Footer/disclaimer:

> ROSSO is an independent, unofficial Formula 1 fan project. It is not affiliated with or endorsed by Ferrari S.p.A., Scuderia Ferrari, Formula 1, Formula One Management, or the FIA. All trademarks belong to their respective owners.

Further rules:
- do not present ROSSO as an official Ferrari product,
- do not use an official Ferrari logo as the ROSSO brand,
- avoid redistributing copyrighted livery files,
- avoid implying sponsorship,
- record attribution for third-party assets.

This specification is not legal advice.

---

# 29. Recommended codebase structure

```text
src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers/
│
├── data/
│   ├── drivers/
│   ├── cars/
│   ├── seasons/
│   ├── sources/
│   └── chapters.ts
│
├── 3d/
│   ├── GarageCanvas.tsx
│   ├── environment/
│   ├── bays/
│   ├── cars/
│   ├── helmets/
│   ├── camera/
│   ├── loaders/
│   └── engineering/
│
├── features/
│   ├── driver-directory/
│   ├── guided-tour/
│   ├── engineering/
│   ├── season-timeline/
│   ├── performance/
│   ├── sources/
│   └── ask-garage/
│
├── ui/
│   ├── typography/
│   ├── dialogs/
│   ├── controls/
│   └── layout/
│
├── hooks/
├── stores/
├── utils/
├── assets/
│   ├── portraits/
│   ├── helmets/
│   ├── cars/
│   ├── textures/
│   └── audio/
│
└── styles/
```

---

# 30. State management

Suggested central stores:

## `useMuseumStore`
- selectedChapter
- selectedDriver
- selectedYear
- activeMode: story / machine
- 2D / 3D
- dialog states

## `usePerformanceStore`
- mode: performance / quality
- DPR
- shadows
- postprocessing
- auto-detected capability

## `useTourStore`
- active
- step index
- current step
- paused
- completed steps

## `useAssetStore`
- current car
- loading progress
- loaded asset references
- errors

Do not put all UI state into one giant store.

---

# 31. Error handling

Every heavy asset should have a fallback.

If portrait fails:
- initials / silhouette

If helmet fails:
- abstract helmet

If detailed car fails:
- era silhouette + message

If WebGL fails:
- 2D archive

If a factual dataset field is missing:
- hide field rather than display `0`

Never crash the entire museum because one model failed.

---

# 32. Loading experience

Avoid blank screens.

Initial:
- ROSSO mark
- loading line
- short text: "Preparing the garage."

Driver car:
- keep bay visible
- animated car outline on plinth
- "Preparing F2004 study…"

The user should always have context.

---

# 33. Accessibility

- keyboard-accessible top-level navigation
- driver directory fully usable by keyboard
- focus styles
- alt text on portraits
- ESC closes dialogs
- adequate contrast
- reduced-motion support
- optional captions for sound/narration
- no critical interaction that requires hover
- avoid text smaller than practical minimums

---

# 34. Development workflow — recommended path from here

## 34.1 Stop using Work as the primary coding loop

The initial Work run did its job:
- it created the concept,
- bootstrapped the codebase,
- established the first visual direction.

Do **not** spend most of the remaining Astra allowance asking Work to repeatedly rebuild the same repository.

From this point, the repository needs:
- iterative code inspection,
- small fixes,
- regression checks,
- refactors,
- asset integration,
- debugging.

That is better suited to Codex / Claude Code inside the actual repository.

## 34.2 Recommended environment

Primary development workspace:

**Antigravity IDE**
- open the existing ROSSO repository
- run local dev server
- use source control
- use browser devtools
- use terminal

Inside it:
- **Codex** for implementation, code review, targeted refactors, tests, performance
- **Claude Code** for architecture review, UI/UX reasoning, multi-file planning, debugging when useful

Do not ask both agents to edit the same files simultaneously unless you deliberately isolate branches.

## 34.3 Suggested agent roles

### Codex
Give it:
- concrete implementation tickets
- file-level bugs
- tests
- performance profiling
- refactoring
- Three.js lifecycle issues
- TypeScript fixes

### Claude Code
Give it:
- UX review
- architecture plan
- guided tour design review
- asset pipeline planning
- visual hierarchy critique
- larger cross-file plans before implementation

Then use the other agent for review.

Example:
1. Claude Code proposes guided tour architecture.
2. Codex implements it.
3. Claude Code reviews behavior and code.
4. Codex fixes final issues.

## 34.4 Use Work selectively

Use ChatGPT Work / Astra only for tasks where its broader autonomous workflow is worth the shared allowance:

- one-time deep historical research pack
- asset/license research
- deployment audit
- final end-to-end QA
- a major redesign checkpoint
- generating a polished project launch/README package

Avoid spending Astra usage on:
- "make button 10px lower"
- routine TypeScript errors
- repeated small code edits
- small CSS adjustments

---

# 35. Work/Codex allowance strategy

On Plus, Work and Codex share the included usage allowance, and GPT-6 Astra can consume that allowance faster than GPT-5.6 Sol.

Practical strategy:
- use Astra for difficult architectural / multi-step tasks,
- use GPT-5.6 Sol or a lighter capable model for routine implementation where available,
- keep prompts scoped,
- do not resend huge screenshots and full spec on every turn,
- store this file in the repository and tell the agent to read it,
- check current allowance under ChatGPT Settings → Usage.

This project can be completed without upgrading the laptop or running local AI.

---

# 36. GitHub / connectors

## Recommended
Connect the ROSSO GitHub repository to ChatGPT if you want Work/ChatGPT to inspect repository content directly.

Benefits:
- less copy/paste,
- easier review of current code,
- easier project-wide reasoning,
- cleaner handoff between Work and repository tasks.

This connection is helpful, not mandatory.

## Not required
You do not need:
- Google Drive
- Gmail
- Calendar
- Ferrari account
- Formula1.com login

for the core product.

## Runtime/API connections — later
Optional:
- OpenAI API for Ask the Garage
- OpenF1 for recent telemetry
- Jolpica for results/history
- analytics provider if you want visitor metrics

Secrets must live in environment variables/serverless configuration.

---

# 37. Version-control strategy

Create branches by feature:

```text
main
develop
feature/driver-bays
feature/guided-tour
feature/car-asset-system
feature/exploded-view
feature/portrait-pipeline
feature/readability
feature/performance
```

Before agent edits:
- commit current working state

After each feature:
- run lint
- typecheck
- tests
- production build
- quick browser smoke test

Do not let an agent make 50 unrelated edits in one unreviewed change.

---

# 38. Immediate backlog based on current screenshots

## P0 — must fix first

### 1. Readability
- increase smallest font sizes
- improve contrast
- increase clickable target sizes
- verify 1366×768 and 1920×1080

### 2. Guided Tour
- replace current broken behavior with central tour controller
- create Schumacher-only tour first

### 3. Driver bay system
- every driver visible in garage without loading all cars
- portrait panel
- name
- years
- helmet/placeholder
- plinth/car outline

### 4. Car asset abstraction
- stop binding scene directly to one procedural car
- create `CarAsset` + `carsByYear` system

### 5. Separate museum states
- corridor
- driver focus
- engineering

## P1 — next

### 6. First three historically distinct car studies
- Schumacher F2004
- Lauda 312T-era
- Vettel SF71H-era

### 7. Exploded view
- F2004 first
- deterministic component vectors
- list + hotspots linked

### 8. Portrait pipeline
- 17 portrait slots
- licensing metadata
- optimized images
- fallback

### 9. Helmet pipeline
- shared base geometry
- per-driver material/palette
- optional exact licensed asset later

## P2

### 10. Year-specific car switching
- Schumacher full year mapping
- load nearest era model when exact model unavailable

### 11. Chapter atmosphere
- distinct lighting/material cues
- keep same overall visual language

### 12. Better season experience
- highlights first
- full results on expansion

## P3

### 13. Race Lab
### 14. Ask the Garage
### 15. richer sound
### 16. deployment analytics
### 17. more drivers

---

# 39. Acceptance criteria for V2

ROSSO V2 is considered successful when:

- [ ] The landing page reaches the garage without layout shift.
- [ ] The garage visibly contains all selected drivers as lightweight bays.
- [ ] At least 17 driver names/portraits can be navigated from the physical garage or directory.
- [ ] Only selected/nearby detailed 3D content is loaded.
- [ ] Schumacher, Lauda, and Vettel use visibly different era-appropriate car studies.
- [ ] Selecting a Schumacher year can change the displayed car representation or clearly indicate an era fallback.
- [ ] Schumacher's car supports an exploded view.
- [ ] Engineering components can be selected from both 3D and list.
- [ ] Guided Tour works end-to-end for Schumacher.
- [ ] Tiny text is readable on common laptop screens.
- [ ] Performance mode is smooth on integrated graphics.
- [ ] 2D Archive remains fully usable.
- [ ] No major console errors.
- [ ] No missing React keys / Three.js disposal warnings.
- [ ] Production build succeeds.
- [ ] All third-party media has source/license metadata.
- [ ] No unsupported "exact Ferrari model" claim is used for approximate geometry.

---

# 40. Phase plan

## Phase A — Stabilize
Goal: make current prototype robust.

Tasks:
- snapshot current repo
- fix type/build issues
- readability pass
- centralize camera
- fix guided tour state architecture
- audit performance

Deliverable:
stable current experience.

## Phase B — Build the museum layer
Goal: make garage feel populated without loading cars.

Tasks:
- reusable DriverBay component
- driver portraits
- years
- helmet placeholders
- chapter layout
- hover/near/selected states

Deliverable:
all drivers physically represented.

## Phase C — Historical car system
Goal: replace universal car.

Tasks:
- CarRegistry
- car/year mapping
- asset loader
- F2004 study
- 312T-era study
- SF71H-era study
- placeholders for missing cars

Deliverable:
three clearly distinct eras.

## Phase D — Engineering
Goal: make "Machine" a real technical experience.

Tasks:
- named car component groups
- explode config
- animation
- isolate/highlight
- component explanations
- reset state

Deliverable:
Schumacher F2004 engineering demo.

## Phase E — Guided Tour
Goal: create a polished, shareable narrative.

Tasks:
- tour state machine
- authored camera poses
- copy
- intro
- Schumacher chapter
- engineering moment
- completion

Deliverable:
2–4 minute guided experience.

## Phase F — Content expansion
Goal: fill the museum.

Tasks:
- driver stories
- season data
- portraits
- license credits
- era cars

Deliverable:
17-driver V1 content.

## Phase G — Future intelligence
Goal: AI / telemetry.

Tasks:
- Race Lab
- OpenF1
- Ask the Garage
- serverless OpenAI API

---

# 41. Suggested first prompt for Claude Code

Use this after adding this file to the repo:

```text
Read ROSSO_MASTER_SPEC.md completely before making changes.

We already have a working ROSSO prototype. Do not rewrite the project.

Your task is to audit the current repository against sections:
2, 7, 16, 18, 20, 29, 30, 38 and 39 of the specification.

First produce:
1. current architecture summary,
2. exact files involved,
3. gaps,
4. regression risks,
5. an ordered implementation plan.

Prioritize:
- readable typography,
- a deterministic Guided Tour architecture,
- reusable DriverBay system,
- CarRegistry/year-to-car abstraction.

Do not implement yet until the plan is internally consistent.
Do not add 17 cars.
Do not change branding.
Preserve the current visual identity.
```

---

# 42. Suggested first implementation prompt for Codex

```text
Read ROSSO_MASTER_SPEC.md first.

Implement Phase A only.

Do not redesign the whole application.

Goals:
1. make the smallest UI text readable,
2. centralize camera transitions behind a CameraDirector abstraction,
3. replace the existing Guided Tour behavior with a deterministic tour store/controller,
4. implement one working Schumacher-only guided tour,
5. keep manual Explore mode working,
6. preserve Performance / High Quality / 2D Archive modes.

Before editing:
- inspect the current route/state/camera architecture,
- identify the minimal file set.

After editing:
- run typecheck,
- lint,
- production build,
- report files changed,
- report any remaining issues.

Do not start the driver portrait or new car work yet.
```

---

# 43. Suggested second prompt — Driver bays

```text
Read ROSSO_MASTER_SPEC.md sections 7, 8, 9 and 23.

Implement the reusable DriverBay system.

Requirements:
- every selected driver can exist as a lightweight garage bay,
- bay shows driver name, portrait, Ferrari years, era label, short hook,
- add a helmet pedestal using a generic stylized helmet placeholder,
- do not load detailed car models in unselected bays,
- selected bay can request a car asset through CarRegistry,
- preserve the current directory.

Use placeholder portrait assets where licensed assets are not yet available.
Build the data model so real portraits and attribution metadata can be swapped in later.

Test with:
- Ascari
- Lauda
- Schumacher
- Vettel
- Leclerc

Do not duplicate components for each driver.
```

---

# 44. Suggested third prompt — car registry

```text
Read ROSSO_MASTER_SPEC.md sections 10, 11 and 23.

Create a data-driven CarRegistry and driver-year-to-car mapping.

Do not claim exact Ferrari CAD.

Support representationType:
licensed_exact
historically_informed
era_family
placeholder

Refactor the current procedural car so it becomes one registered car asset rather than hard-coded scene geometry.

Implement:
- lazy loading
- loading state
- fallback
- disposal
- driver/year lookup

Use Schumacher 2004 as the first hero entry.
Keep missing cars on explicit placeholders.
```

---

# 45. Suggested fourth prompt — exploded view

```text
Read ROSSO_MASTER_SPEC.md section 12.

Upgrade The Machine from hotspot-only mode to a real exploded-view interaction for the Schumacher 2004 car study.

Requirements:
- deterministic authored animation, no physics simulation,
- parts use named nodes,
- component list and 3D labels remain synchronized,
- explode/collapse button,
- isolate/highlight component,
- reset camera,
- preserve orbit,
- no expensive post-processing.

If current procedural geometry cannot separate cleanly, refactor it into component groups first.

Do not add exploded views to other cars yet.
```

---

# 46. Suggested research task for ChatGPT Work / Astra

Use Work only when you want one large research package:

```text
Read ROSSO_MASTER_SPEC.md from the connected repository.

Do not edit the app.

Create a research pack for the 17 selected drivers.

For every driver:
- Ferrari seasons,
- Ferrari-specific wins/podiums/poles/titles where verifiable,
- representative Ferrari car for each year,
- 3–5 important Ferrari moments,
- source URLs,
- source publisher,
- any data ambiguity.

Primary sources:
Ferrari official history/garage,
Formula1.com,
FIA where appropriate.

Also create a separate asset research table:
- reusable driver portrait candidates,
- source,
- creator,
- license,
- attribution requirements.

Do not download or add media whose license is unclear.

Output machine-readable JSON plus a human-readable research report.

Do not modify the production data until research is reviewed.
```

This is a good use of Astra because it is bounded, expensive research performed once, rather than repeated coding iteration.

---

# 47. Visual polish checklist

Before calling a page "finished":

- [ ] Is there one clear focal point?
- [ ] Is the car large enough?
- [ ] Can driver name be read without squinting?
- [ ] Can the secondary copy be read at laptop distance?
- [ ] Does the camera transition feel smooth but not slow?
- [ ] Are lights guiding attention?
- [ ] Is red used selectively?
- [ ] Does the bay look good before the car loads?
- [ ] Does performance mode still look intentional?
- [ ] Does the UI avoid covering the car?
- [ ] Are hover effects subtle?
- [ ] Is there a clear way back?
- [ ] Is current driver/year visible?
- [ ] Are credits accessible?
- [ ] Is the 3D asset description honest about accuracy?

---

# 48. What not to do

Do not:
- load 17 high-detail cars at startup,
- build photorealistic ray tracing,
- depend on Blender rendering at runtime,
- require CUDA,
- add a local LLM,
- use random Google images,
- use exact copyrighted liveries without rights,
- show a single universal car while labeling it as multiple historical Ferraris,
- hide essential navigation in tiny text,
- make Guided Tour depend on timing hacks like arbitrary `setTimeout`,
- scatter camera animation code across components,
- ship AI answers without source grounding,
- expand to 50 drivers before the core bay system is excellent.

---

# 49. Definition of the portfolio-ready release

A visitor opens ROSSO.

They see a black screen, red line, and restrained title.

They enter.

The camera glides into a dark museum corridor.

Even though only one detailed car may be loaded, the corridor feels populated:
portraits, names, helmets and illuminated bay markers tell the story of Ferrari across decades.

They click **Michael Schumacher**.

The museum moves to his bay.

His portrait becomes visible.  
The F2004 study loads onto the plinth.  
His 2004 season is selected.  
They can orbit the car.

They select **The Machine**.

The UI changes character.

They click **Explode Car**.

The front wing, wheels, floor, sidepods and rear assemblies separate in a controlled technical view.

They click the diffuser.

The relevant part highlights, the camera adjusts, and a concise engineering explanation appears.

They return to the story.

They start **Guided Tour**.

The application walks them through Schumacher's era without broken transitions.

They open the directory and jump to Niki Lauda.

The car architecture visibly changes to a 1970s interpretation.

Then they jump to Sebastian Vettel.

The shape becomes modern: wider aero, different nose/sidepod language and halo-era cues where appropriate.

At no point does their ordinary laptop sound like it is trying to render a AAA game.

That is the target.

---

# 50. Reference sites / services for the development team

Use these categories rather than relying on one source:

## Historical facts and car naming
- Ferrari official site — history, garage, driver pages
- Formula1.com — official F1 history, team and driver pages
- FIA — regulations / formal documents where needed

## Structured race data
- Jolpica F1
- FastF1

## Recent telemetry (future)
- OpenF1

## Reusable media
- Wikimedia Commons — verify each individual file license
- Poly Haven — CC0 environment assets
- Sketchfab — only models whose specific licenses fit the project; record attribution and redistribution restrictions

## Repository / collaboration
- GitHub

---

# 51. Final product statement

**ROSSO is a digital museum of Ferrari Formula 1 history, designed as a place rather than a page.**

Its value comes from the combination of:

- spatial storytelling,
- curated driver history,
- historically informed car architecture,
- interactive engineering,
- strong visual design,
- responsible asset licensing,
- accurate data,
- lightweight browser performance,
- and eventually AI/telemetry interpretation.

The project should feel personal, because that is why it exists.

It is not being built as part of an academic paper, an employer deliverable, or a generic portfolio exercise.

It is a technically ambitious expression of a long-standing interest in Formula 1.

That emotional reason should stay visible in the final experience.
