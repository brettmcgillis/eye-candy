# Brutalist pipeline

Brutalist follows HyperCubes' arrangement (`docs/hyper-cubes-pipeline.md`):
one kernel, two renderers, and a dev tool that is a UI over one of them —
with one difference: there are **two scenes** over the kernel, one per
stage. Change the kernel first, land every consumer in the same commit, and
run `npm run brutalist:check`.

## The shape

```
@modules/brutalist         families (monolith, habitable, spomenik) → parts, cutters, lit panes;
                           siting (terrain, burial, road, tree scatter, ledge saplings);
                           moods, roll, framing, plot SVG, option schema
@modules/brutalistRender   CSG per part (merged cutters), procedural concrete, ez-tree forest,
                           ground, sky + height fog, PetriDish studio + plinth,
                           createBrutalistRig, camera/lighting/post declarations
        │                              │
  WebGPU/Brutalist (forest)      scripts/lib/brutalistRender.mjs
  WebGPU/BrutalistMaquette         ├─ brutalist-generate.mjs   stills + plot SVG
  (Leva generated per stage)       └─ brutalist-video.mjs      drift / turntable
                                        │
             src/dev/server/brutalist → src/dev/tools/brutalist (BrutalistCLI)
```

| Piece                      | Rule                                                                                                                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/brutalist`       | **Three-free.** May import only `@modules/flora` (`createRng`). Solids are a centre, half extents and `yaw`/`tilt`/`pitch` (or a prism profile), never matrices. `brutalist:check` enforces it.                                    |
| `@modules/brutalistRender` | The only home of the look. `createBrutalistRig({ Tree, stage })` is the one object both scenes and the CLI draw with: `apply`, `setStructure`, `setSite`, `setPhase`, `attach(scene)`.                                             |
| `renderOptions.mjs`        | Every knob, once. `stages` says which scene shows a key (`forest`, `maquette`); each scene's Leva is generated from `levaKeysFor(stage)` and its presets spread `stageDefaults(stage)`. Facets: `form`, `weather`, `site`, `mood`. |
| Rig keys                   | `light*` / `post*` keys are declared with `rig: true`; their defaults must equal `lighting.js` / `post.js`. Forest slots are `sun` + `sky`, maquette slots `key` + `fill`.                                                         |

## The vision

Coming upon something enormous, old and unexplained in a forest. Unease comes
from scale, state and stillness, not from motion:

- **Nothing moves but the fog.** Trees have no wind, there are no birds, a
  lit window never flickers. Film grain ships still.
- **Weathered, intact.** Age is surface only. The kernel never breaks
  geometry.
- **60–150m** against 20–30m trees. Scale is sold by human-sized details
  (a giant door beside a person-sized one up a few steps, spouts, balcony
  upstands), the height fog thinning toward the top, and a low, long-lens
  camera. The forest orbit is clamped near the ground for that reason.

## The kernel

`buildStructure(config)` runs one family grammar over a book of parts:

- **monolith**: tiers that step back or cantilever, necks that float the
  upper tiers, fin rows, windowless cores, slit windows, rooftop plant.
- **habitable**: `slab` / `tower` (Barbican balconies with solid upstands,
  sky-garden recesses, pilotis, a Trellick service tower with bridges) or
  `stack` (Habitat 67 modules on alternating axes, each resting at least
  half on the one below).
- **spomenik**: `fan`, `split`, `ring` or `pierced` prisms on a stepped
  plaza whose steps are real 0.17m risers.

The rng order inside a family is load-bearing. Masses interpenetrate and do
not union; mass and core parts are nudged a few centimetres so their faces
never coincide. **Cutters of one part must be disjoint**: they merge into
one brush for one boolean, so `book.cut` refuses an overlapping cut, and
doors are cut before windows so a door wins.

`scatterTrees` darts trees into an annulus that crowds the clearing's edge.
An old road runs out along the approach bearing (`ROAD_BEARING`), and tree
crowns are kept off it so the eye-level camera stands on it. `encroach`
shrinks the clearing, lets young trees in, and roots saplings on open
roof ledges (`ledgePoints`). `groundAt` is flat at the foot, rough a little
way out and hilly beyond. Its burial hillside (`burialAt`) is analytic
because the concrete's splash band mirrors it in TSL (`surface.js`).

## The look

- **Carving**: every vertex carries `aWeather = (top, bottom, seed, role)`
  through the boolean. Cut faces carry `16 + cutRole * 2 + back`, so the
  shader knows a reveal from a wall and a window's back (its glass) from
  its reveal. The whole structure is one geometry and one draw call.
  `three-bvh-csg` is imported from `src/index.js`, because its UMD `main`
  throws headless.
- **Concrete** is procedural and in the geometry's metres, so the model on
  the plinth weathers exactly like the full-size structure. It has board-form
  seams and tones, pour-lift joints, tie holes with rust runs, rain streaks
  off every part's top, roof and soffit grime, a splash band, efflorescence
  and moss (up-facing, climbing from the ground, north faces, water paths).
  Fine detail fades by `fwidth` so distant walls do not shimmer. The bump is
  scaled by `modelScale`, because view-space derivatives shrink with the
  model. `look: maquette` swaps all of it for plaster.
- **Trees**: ez-tree supplies geometry only. Its textures load at import
  time, so the CLI imports it behind a stubbed `document`, and the rig takes
  the `Tree` class injected. Templates are thinned into `near` / `far`
  detail levels, are unit height, and are cached. Instances use a storage
  `instanceMatrix`, because a uniform one overflows past 1024.
- **Atmosphere**: exponential height fog integrated along the view ray, in
  banks that drift on `setPhase(seconds)` (the caller's clock, never TSL
  `time`), under a long-range haze. The sky meets the fog at the horizon, so
  the top of the structure fades into it.
- **Maquette**: PetriDish's cyclorama and pooled floor, with a plinth sized
  to the footprint. The model is scaled to `modelHeight` and lifted onto it.

## Outputs

- **Stills** on either `--stage`. Views: `approach` (eye height on the road,
  looking up, top cropped), `hero`, `front`, `right`, `back`, `left`.
- **Video**: `drift` (a slow dolly up the road) or `turntable`. The fog
  drifts on the clip's own clock.
- **Plot SVG**: every part and opening edge through the same camera, with
  hidden lines dropped against the render's depth. Three pens: masses,
  details, openings.

## Definition of done

- `npm run brutalist:check`
- `npm run lint:fix`
- `npm run brutalist:generate -- --count 1 --svg`
- `npm run brutalist:generate -- --count 1 --stage maquette`
- `npm run brutalist:video -- --count 1 --pixelRatio 1 --hold 2`
- Both scenes still render in the browser (human eyeball).
