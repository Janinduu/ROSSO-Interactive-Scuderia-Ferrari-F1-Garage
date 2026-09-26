# Car, helmet and engineering detail update

Scope: original 3D models, their engineering transforms and inspection framing. Museum layout, stories, navigation, audio, tours and race data are unchanged.

## Reference basis

- [Formula 1 / Mark Hughes and Giorgio Piola: Ferrari 312T construction](https://www.formula1.com/en/latest/article/tech-tuesday-under-the-bodywork-of-mauro-forghieris-masterpiece-the-ferrari.kftnvmyfKpzrrB5NdO1xz): low, wide flat twelve; side-mounted radiators; transverse gearbox; tall intake on the 1975 car.
- [Bell HP77](https://www.us.bellracing.com/p/hp77/) and [Ferrari's helmet construction feature](https://www.ferrari.com/en-US/competizioni-gt/articles/tech-insight-the-bell-racing-helmet): separate shell, liner, visor, seals and ventilation. The geometry is an era-based interpretation, not an exact HP77 model.
- [RM Sotheby's 2004 Schumacher Schuberth helmet](https://rmsothebys.com/auctions/sc23/lots/n0052-2004-michael-schumacher-schuberth-scuderia-ferrari-formula-1-helmet/): red shell, gold visor and contrasting white graphics, supplementing the existing helmet reference pack.
- Existing individually sourced `carsByYear.json`, `liveries.json` and `helmetDesigns.json` retain the car/year, sponsor and driver-colour references. F2004 and SF71H body dimensions are visual approximations; the F2004, 312T and SF71H now have separate wing and sidepod presets.

Ferrari's direct F2004/312T/SF71H model pages returned a verification screen during this research session; they were not treated as newly verified specifications. No external mesh or image assets were downloaded or embedded.

## Implementation limits

These remain original, historically informed procedural models, not scanned replicas or factory CAD. Detailed accessory routing, cooling cores, fasteners and suspension are illustrative. Helmets share era-shaped shells with driver-specific paint; fine sponsor typography and race-specific variants remain approximate. The existing accuracy labels are retained.

The engine assembly replaces the earlier rectangular proxy. Wheel/brake groups remain separate for axial disassembly, sidepods clear the cooling system, the engine cover lifts above the powertrain, and the floor remains above the plinth. Component anchors track those authored offsets.

## Verification

`npm run build`, `npm test`, and `node --test scripts/models.test.mjs`. The model tests check finite surfaces across all families, wing/floor bounds, reversible explode progression and engine-era boundaries. Browser checks cover assembly, explode, component selection, isolation and reset.

## Hall trophies, helmet construction and orbit cutaway

The modern drivers' award is informed by [Fox Silver's original design and manufacturing record](https://foxsilver.net/projects/fia-formula-1%C2%AE-world-championship-drivers%E2%80%99-trophy): a silver body, gold spiral edged in laurels, enamel details and a globe. The model adds broad spiral strips, merged laurel leaves, a shaped rim and a blue globe with metallic meridians. Constructors' awards use the existing sourced trophy-era dossier: a flared panelled vase, enamel badges, a shaped dark rim and a decorated foot. Early undocumented awards retain their explicit generic labels. Decorative engraving does not pretend to reproduce champion signatures or every historical team badge.

Helmet improvements include an eye aperture, inner shell, visor tear-off posts and latch, iridescent coating, period peaks, Surtees' sloped blue band, and Raikkonen's silver lines/ICEMAN markings from the existing reference pack. Geometry and fine artwork remain interpretations.

The corridor backdrop and its boards cut away before the orbit camera enters the wall (z < -3.15), then return when the camera comes forward (z > -2.9). The exhibits and floor remain visible. This preserves unrestricted orbit without showing a wall's dark back face. No navigation or museum layout was changed.


## Helmet and trophy finishing pass — 26 September 2026

Changes are limited to the shared helmet and trophy models. Claude Code's saved
room, navigation, car, audio and presentation work remains unchanged.

- Bell HP77 product photograph and construction description:
  https://www.us.bellracing.com/p/hp77/
  Used for the swept shield outline, narrow modern eye opening, perimeter gasket
  and chin profile. Earlier helmets retain their period shell and paint.
- Fox Silver drivers' award photograph:
  https://foxsilver.net/projects/fia-formula-1%C2%AE-world-championship-drivers%E2%80%99-trophy
  Corrected smooth rolled mouth, tapered body, dense gold laurel spiral,
  silver stepped foot and lower enamel wreath.
- Matt Buck's 2014 constructors' trophy photograph:
  https://commons.wikimedia.org/wiki/File:MotorExpo_2014_MMB_07_Formula_One_Constructors%27_Trophy.jpg
  Used to refine the long body, flared mouth, dark/gold rim and rectangular
  enamel plaque arrangement. Photographs were consulted, not incorporated.

These remain original procedural interpretations: team plaque artwork and
historic awards without reliable documentation are not exact replicas.
