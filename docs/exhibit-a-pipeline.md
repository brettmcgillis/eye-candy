# ExhibitA pipeline

ExhibitA follows Apollian's arrangement (`docs/apollian-pipeline.md`): one
kernel, one rig, and a dev tool that is a UI over the headless CLIs. Change
the kernel first, land every consumer in the same commit, and run
`npm run exhibit-a:check`.

## The shape

```
@modules/exhibitA         exhibit registry (families, exhibits, params), CPU solid fields,
                          attractor / polytope / surface / strings builders, framing, motion,
                          roll, option schema
@modules/exhibitARender   createExhibitRig: museum stage (plinth, floor, studio, key spot),
                          field proxy + mesh layers, materials
        │                              │
  WebGPU/ExhibitA scene         scripts/lib/exhibitARender.mjs
  (R3F, Leva generated)           ├─ exhibit-a-generate.mjs   stills per view
                                  └─ exhibit-a-video.mjs      turntable / sweep / evolve / draw
                                        │
             src/dev/server/exhibitA → src/dev/tools/exhibitA (ExhibitACLI)
```

| Piece                            | Rule                                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/exhibitA`              | Three-free. Rendering code belongs in `@modules/exhibitARender`.                                                                                    |
| `@modules/exhibitARender`        | `createExhibitRig()` is the one object the scene and the CLI draw with: `setExhibit(config, build, footprint)`, then `apply(config, { stops, … })`. |
| `renderOptions.mjs`              | Every knob, once; the scene's Leva is generated from it (`utils/controls.js`). Facets: `form`, `look`, `stage`. A flag typed on the CLI is a pin.   |
| `scripts/lib/exhibitARender.mjs` | The capturer: `load(drawn)` builds the exhibit and returns its stage layout, `capture(view, { config, lightAzimuth, progress })` draws one frame.   |

## Outputs

- **Stills**: views `hero`, `front`, `side`, `top`, fitted to the exhibit and
  plinth by `frameView`; one folder per exhibit (`batch`, `batch-1`, …) with
  `props.json` (the flat scene preset plus the render options).
- **Video**: `turntable` (the camera orbits, `--turns`), `sweep` (the key
  light swings once over `--hold`), `evolve` (`evolveConfig`; a mesh exhibit
  is rebuilt each frame), `draw` (the exhibit builds up over `--hold` minus
  `drawHold`, then holds). `--orbit` drifts the camera on the last three.
  An unpinned `draw` roll skips the ray-marched families, which have nothing
  to build.

## ExhibitACLI

`/dev/exhibit-a` is the same options as the CLIs, rendered from the schema
(`src/dev/renderWorkbench`). Tick the families to roll from; hold facets to
keep an exhibit's form, look or stage while the rest roll; open a generation
and **Roll variations** to start from it, or **Save as scene preset** to
append it to the `Object.assign(PRESETS, …)` literal in the scene's
`presets.js`. Exhibit parameters show only for the exhibit the form has
selected.

## The check

`npm run exhibit-a:check` (about a minute) fails on drift between the kernel
and everything that shares it:

- **Kernel purity**: `@modules/exhibitA` imports only `@modules/apollian` and
  `@modules/flora`.
- **Rig defaults**: the `post*` keys declared `rig: true` equal `post.js`.
- **Scene presets**: every Leva key present and in range, enums valid, and
  every exhibit on the plinth in at least one preset.
- **Registry and motion**: every exhibit has a builder and an `EVOLVE` entry,
  every step walks a numeric option, and an evolve stays inside each knob's
  range; draw progress starts, ends, holds and restarts.
- **Rolls**: 400 rolls stay in range, reach every exhibit, and the first of
  each builds (mesh geometry finite and inside the unit ball); holding a
  facet leaves it alone; a `props.json` restores as a preset.
- **CLIs and workbench**: every kernel/rig function the scripts call is
  exported, and the page's hand-laid fields exist in `renderOptions.mjs`.
- **Draw**: every exhibit with every material builds its pipeline in Dawn
  without a WGSL validation error and draws a non-flat frame.
- **CPU/GPU parity**: each ray-marched exhibit, drawn orthographically on a
  black and a white backdrop, must cover the same pixels as sphere-tracing its
  CPU field (≥ 98.5% of the pixels whose neighbours agree; healthy exhibits
  measure 99–100%). Only `scene.background` differs between the two frames,
  because `config.background` re-bakes the studio lighting.

## Definition of done

- `npm run exhibit-a:check`
- `npm run lint:fix`
- `npm run exhibit-a:generate -- --count 2 --views hero,top`
- `npm run exhibit-a:video -- --mode draw --hold 2`
- The scene still renders in the browser (human eyeball).
