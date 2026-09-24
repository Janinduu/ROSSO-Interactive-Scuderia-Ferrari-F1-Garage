# Verification — 24 September 2026

- TypeScript and Vite production build: passed.
- Dataset tests: 4 passed, 0 failed. Checks cover all 17 drivers, core Ferrari totals, shared-drive deduplication, interrupted careers and the 2025 cutoff.
- Dependency installation audit: no known vulnerabilities reported at installation.
- Desktop browser: entry, Schumacher 2000 season, race expansion, next-driver tour, searchable directory, Lauda/Vettel navigation, era car labels and engineering hotspots checked.
- Orbit drag moved projected car markers; reset returned the camera. Nine hotspots mounted in the production build.
- High/performance mode switching and manual 2D archive round trip checked.
- Mobile: 390×844 and 360×800 layouts inspected; no horizontal page overflow at the narrow breakpoint. Landing and engineering layouts visually checked.
- Native dialog keyboard Escape, curated Ask the Garage response and important-car context checked.
- Final production preview loaded successfully; console inspection returned no warnings or errors.
- Fonts are local, and the Barlow OFL licence is included with static output.
- The initial document preloads React, not the 3D renderer. The renderer is a separate lazy bundle, approximately 245 KB gzipped. Vite flags its uncompressed size as a large chunk; it is kept separate from the readable interface.

This is functional and layout QA in the available browser, not a cross-device GPU benchmark. No live 2026 data, AI backend, licensed Ferrari models or public deployment is included.
