# Push Comes to Shove pipeline

Push Comes to Shove follows HyperCubes' arrangement
(`docs/hyper-cubes-pipeline.md`): one kernel, two renderers, and a dev tool
that is a UI over one of them. Change the kernel first, land every consumer in
the same commit, and run `npm run push-comes-to-shove:check`.

## The shape

```
@modules/pushComesToShove        layout, hole field + surface-nets panel mesh, hole outlines,
                                 wire/cylinder seeding, palette maths (CPU hash mirror),
                                 facet roll, field fitting, framing, loop planner, plot SVG,
                                 option schema
@modules/pushComesToShoveRender  GPU cable sim (grid, Jacobi PBD solve, cylinders, RMF frame
                                 pass), tube / cylinder / panel materials, palette LUT,
                                 createShoveRig, camera/lighting declarations
        │                              │
  WebGPU/PushComesToShove scene   scripts/lib/pushComesToShoveRender.mjs
  (R3F, Leva generated)             ├─ push-comes-to-shove-generate.mjs   stills + plot SVG
                                    └─ push-comes-to-shove-video.mjs      loop / run
                                          │
      src/dev/server/pushComesToShove → src/dev/tools/pushComesToShove (PushComesToShoveCLI)
```

| Piece                             | Rule                                                                                                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/pushComesToShove`       | **Three-free.** May import only `@modules/flora` (`createRng`), `@utils/noise2d` and `@utils/paletteStops`. `push-comes-to-shove:check` enforces it.                                                     |
| `@modules/pushComesToShoveRender` | The only home of the look and the sim. `createShoveRig()` is the one object the scene and the CLI draw with: `apply(config)` rebuilds only what changed, `step` / `warm` advance the sim before a frame. |
| `renderOptions.mjs`               | Every knob, once; the scene's Leva is generated from it (`utils/controls.js`). Facets: `structure`, `color`, `motion`, `atmosphere`. `PANEL_KEYS` / `TANGLE_KEYS` (`layout.js`) are what rebuild.        |
| Rig keys                          | `light*` keys are declared with `rig: true`; their defaults must equal `lighting.js`. The key light is spherical so its bearing rolls.                                                                   |

## Pucks

The cylinders are pucks: they hang off the panel's back and reach
`cylinderDepth` (default a quarter) of the way into the cavity, so cables
fill in behind them instead of parting round them. A wire overlapping a puck
is pushed out sideways or back behind its face, whichever is shallower, and
only a sideways push is felt by the puck. Seeding drops wires near a puck in
behind it, easing over `TUCK_FADE`; at full depth (no room behind) it routes
them round instead. `puckBackOf` is the one definition of the back face.

## Colour

One palette LUT (`@utils/gradientPalette`) is shared by four targets, each
with its own `paint*` toggle; an unpainted target keeps its own colour. Each
painted target is **one colour**, never a gradient: the panel face, the hole
walls and the cylinders each sit at a single palette spot (`faceTone`,
`rimTone`, `cylinderTone`, 0–1), and every wire draws one colour of its own at
random (`paletteSeed` reshuffles them). `paletteExact` keeps those colours on
the palette's stops. The rim is where the panel's normal turns away from the
face, with a narrow seam on the fillet.

`random` is TSL `hash(id * 12.9898 + paletteSeed)`. The kernel's
`randomTone` is a bit-exact CPU copy (including the float-to-uint truncation)
so the plot SVG's pens are the shader's colours; the check compares 4096 ids
read back from Dawn.

## Roll

`rollShoveConfig(batchSeed, { base, keep, palettes, pinned })` rolls each
facet on its own `${seed}:${facet}` stream:

- **structure**: holes, panel thickness and bevel, cavity depth, wire radius,
  slack, tangle and seeds. Wire count follows from a packing share (0.34–0.46)
  of the cavity's cross-section, so cables always fill it; cylinder count and
  radii from a share of the field's area. `capPoints` keeps the sim under
  `MAX_POINTS`.
- **color**: palette (rolls pick from palettes with ≥ 3 stops), exact stops,
  wire seed, which targets are painted (wires most often, the face least; a
  few rolls stay unpainted), face / rim / cylinder tones on three different
  stops, and one family of light or dark neutrals for whatever is unpainted.
- **motion**: writhe, end drift, cylinder wander.
- **atmosphere**: background, back wall, key light colour, bearing and
  intensities.

The scene's Palette, Panel and Motion folders each have a Roll button that
re-rolls that facet alone.

## Outputs

- **Field fitting**: with `fitField` on (the default) the field takes the
  output's aspect at the same area and the wire count scales with its width,
  so packing holds. A pinned `fieldWidth` / `fieldHeight` turns it off.
- **Settling**: every panel is simulated for `warmup` seconds at a fixed
  1/60 s step before its first frame.
- **Stills**: views `front`, `left`, `right` (±18°) and `high`, `low` (±16°).
  `field` framing keeps the frame inside the holes' field edge to edge;
  `panel` fits the whole slab. ACES tone mapping and PCF soft shadows, as on
  the scene's canvas.
- **Video**: `loop` simulates each panel for `hold + fade` seconds and
  crossfades its tail over the next panel's head, the last over the first, so
  the clip loops seamlessly (crossfade frames are spooled to disk beside the
  output, not held in memory). `run` hard-cuts between `hold`-second runs.
  `sway` swings the camera once per hold, so it is continuous across fades.
- **Plot SVG**: hole outlines (the cutter's zero level at the fillet's
  depth), every wire's smoothed centreline and each cylinder's cap ring,
  through the same camera. Hidden lines are dropped against the render's
  linear depth pass; wire centrelines are lifted by their radius first. One
  pen for the rim, one for the cylinders, one per wire colour (snapped to the
  nearest stop), one Inkscape layer each, no background.

## Definition of done

- `npm run push-comes-to-shove:check`
- `npm run lint:fix`
- `npm run push-comes-to-shove:generate -- --count 1 --svg`
- `npm run push-comes-to-shove:video -- --count 2 --pixelRatio 1 --hold 3`
- The scene still renders in the browser (human eyeball).
