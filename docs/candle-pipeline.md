# Candle pipeline

CandleCLI renders, films and plots the Burning At Both Ends scene from rolled
generations, and its Live tab burns one in the page to orbit, snuff and
capture. It is the BirdsArentReal arrangement
(`docs/birds-arent-real-pipeline.md`): the stage is a **real R3F component
tree**, mounted on the headless WebGPU renderer by the CLI, in a `<Canvas>` by
the Live tab, and as the scene itself. Run `npm run candle:check` after
changing any piece below (`-- --render` also burns a lit and a snuffed candle
headlessly and checks the frame and the plot). The check also fails when an
option-schema section has no Leva folder in `utils/controls.js` — that breaks
every preset change that sets one of its keys (docs/scene-conventions.md §9).

## The shape

```
@modules/candle            three-free: option schema, roll, wax form (SDF) and mesher,
        │                    flame states + signal, placement, framing, plot
@modules/candleRender      CandleStage (R3F stage), the fluid-sim flame (fireSim),
        │                    the sorted curl smoke (curlSmoke), wax/wick, legacy
        │                    flames and smoke, capture read-backs
        ├─ WebGPU/BurningAtBothEnds    CameraRig + CandleStage, Leva from the schema
  scripts/lib/candleRender.mjs         src/dev/tools/candle
    ├─ candle-generate.mjs               CandleWorkbenchPage (RollWorkbench)
    │    stills + plot, or --capture     └─ LiveCandle (Live tab)
    └─ candle-video.mjs                          │ POST /dev-api/candle/captures
         burn / snuff / montage / turntable  src/dev/server/candle → generate --capture,
                                               /presets → the scene's PRESETS
```

| Piece                   | Rule                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/candle`       | **Three-free.** May import only `@modules/flora` (rng), `@modules/plotKit` and `@utils/paletteStops`; the check enforces it.                              |
| `@modules/candleRender` | The only home of the stage. **No drei** (it mounts headlessly); `Smoke2DGPU` faces the camera with its own `Facing` group for that reason.                |
| `renderOptions.mjs`     | Every knob once. Facets `candle`, `fire`, `smoke`; `stage` and `post` are never rolled. The candle's height is `candleHeight` — `height` is the output's. |
| Generation-only keys    | `settle` (`config: true`, `scene: false`): seconds burned before a still.                                                                                 |

## A generation

- **The candle** (`candleForm`, `buildWax`). One signed distance field in
  candle space (y up the axis, middle at the origin): the profile body
  (pillar, spindle, waisted, twisted, fluted, faceted) and, folded so the
  bottom end is the top turned half a turn about z (the suicide king), the
  rim cap, the crater and its liquid pool, buildup sheets and notched drips
  — all smooth-unioned, so no part meets another at a crease. Meshed by
  narrow-band surface nets (`surfaceNets.js`, ~1 s at the default detail).
  Two bakes ride on the vertices: `glow`, the flame light that would pass
  through the wax to reach each vertex (marched through the field, so thin
  rims glow and thick wax does not), and `pool`.
- **Flame systems** (`flame`): `sim` (below), `shader` (`FlameGPU`),
  `slices` (`VolumetricFireGPU` with the `burningAtBothEndsFire` spline), or
  `out`. **States** (`FLAME_STATE_PARAMS`) set buoyancy, turbulence, how long
  the gas stays hot, soot, flicker, sway and draught for calm, flicker,
  gutter, breeze and sooty; out wicks are snuffed, smoulder or cold
  (`EMBER_STATE_PARAMS`). `flameSignal(config, t)` is the one pure CPU signal
  the sim, the lights, the wax glow and the smoke read.
- **Smoke systems** (`smoke`): `curl` (below), `billboard` (`Smoke2DGPU`),
  `ribbon` (`VolumetricSmokeParticlesGPU`) or `none`.
- **Smoke seeds** become small noise offsets and phases on the CPU
  (`setSeed`): simplex noise loses precision far from the origin, and raw
  seeds in the thousands flattened the stream into a straight line.
- Flames, smoke and lights stand **upright in the world** however the candle
  leans; `candlePlacement` gives their anchors and `mirrorEnd` the bottom's.

## Looks (`look`, facet `style`)

One generation, three ways of drawing it. Stylised looks redraw only the sim
flame and the curl smoke, so a stylised roll swaps a legacy flame or smoke
for them (unless it was pinned).

| Look        | Wax                                                                                                                                    | Flame (same sim)                                                                                                                    | Smoke (same particles)                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `realistic` | translucent wax, baked glow                                                                                                            | emission + soot march                                                                                                               | sorted, age-faded haze                                                                                                                        |
| `cartoon`   | unlit toon bands (`toonBands`) from a fixed key and the flames, saturated, inverted-hull ink outline (`toonOutline`, `toonInk`)        | hottest heat along the ray quantised into flat fire bands, ink edge from `fwidth`                                                   | 1 % of particles as flat puffs with a crescent shadow; ink discs drawn first and fills over them, so ink survives only on the cloud's outline |
| `clay`      | `clayLumps` baked into the SDF (so the plot shows them), saturated, rough, `clayPrints` thumb dents in the normal, a studio fill light | first isosurface hit, bisected, normals from the field's gradient, orange skin with the yellow core showing where it is hot beneath | one ball per 64 particles, instanced lumpy clay spheres                                                                                       |

Stylised looks bring their own colours: `styleWax` and `styleBackground`
(facet `style`, rolled from per-look palettes — candy waxes on deep
backdrops for cartoon, plasticine primaries on felt-toned sets for clay)
replace `waxColor` and the stage backdrop, so holding `candle` keeps a
realistic candle's wax while a stylised one still recolours. Stylised
flames burn shorter and wider, and stylised smoke curls less and
leaves from inside the (opaque) flame, which hides where it starts. Clay is
**stop-motion**: the driver advances in whole poses (`clayFps`, default 12,
so "on twos" at 24 fps) and the sim and smoke integrate each pose's step;
nothing moves between poses. Cartoon tone-maps Neutral (flat colours keep
their saturation) and lifts the bloom threshold. Cartoon puffs pop at
`PUFF_POP` of their life rather than dwindling to specks, and their ink
discs scale with them. In the plot, cartoon puffs
and clay balls become outlined circles (the CPU mirrors their PCG-hashed
sizes exactly).

## The fluid-sim flame (`fireSim.js`)

A port of three's `webgpu_volume_fire`: the same compute passes (advect
velocity with buoyancy against soot weight, thermal + ambient curl
turbulence from a precomputed curl texture, divergence, Jacobi pressure,
projection, dye advection with cooling / dissipation / age) on a 32 × 96 × 32
grid in a box over the top wick. Candle-specific changes:

- The emitter is the wick's burning segment (a capsule falloff) rather than
  teapot vertices, and emission happens inside the dye-advection pass.
- The dye's `a` channel is unburnt **fuel**, which gives the flame its dark
  core; age drives the **blue base** and where it turns luminous.
- Thermal turbulence is gated by age (laminar at the wick) and its noise
  scrolls with time — the static curl texture otherwise leans every flame
  the same way.
- Forces scale with a fixed height (`FORCE_HEIGHT`, the box the solver was
  tuned in), not the box's — the example scales them by its box, so a
  taller box burned a thinner flame. Cells stay cubic.
- It is not drawn with `VolumeNodeMaterial`, which marches the whole camera
  ray (far too coarse for a candle). A box-clipped march draws it instead,
  clipped where the camera ray first enters the wax (`waxEntry`): an
  analytic test against the candle as a cylinder of its widest body radius
  between the rims, less a crater pocket at each end, so wax far outside the
  flame's box (the candle's body in front of the bottom flame) still hides
  it. `viewportLinearDepth` reads 0 or garbage in the headless and
  output-target paths, so it is not used. `candle:check --render` fails if
  the bottom flame adds light over the candle seen from above.
- One sim is drawn twice: upright, and turned half a turn for the bottom end.

## The curl smoke (`curlSmoke.js`)

The TouchDesigner recipe: many particles, each nearly transparent, opacity
by age, sorted back to front every frame (a bitonic network over both ends'
copies) and alpha-blended. A particle rises in a laminar thread that
meanders, then breaks into curl-noise eddies past `smokeLaminar`; sprites
grow only once broken, so the thread stays a thread. Spawns are spread
across the sub-frame (whole-frame batches rose as visible beads), and
spread comes from the curl field itself (a per-particle random drift made a
cone). While lit it leaves the flame tip; out, the wick.

`curlNoise` (three's addon) returns exactly 0 outside roughly y ∈ [−10, 90]
and x, z ∈ [−30, 150] of its input. The pattern drifts up with time, so an
unbounded drift left the window after about a minute and the whole plume
settled to a straight line (the eddies are the only thing that moves it
sideways). The drift therefore wraps every `NOISE_PERIOD` units, two copies
half a period apart cross-faded so one is always mid-window while the other
jumps back. `candle:check --render` burns a snuffed candle with the smoke
clock pushed to 3600 and fails if the plume is shorter than at the start.
Any other scene that scrolls a curl-noise coordinate with time has the same
limit.

## Capture and the plot

`createCandleCapturer` mounts the stage, swaps `Math.random` for
`burnRandom(name)` (the legacy elements use it), burns `settle` seconds at
60 fps with the hero camera aimed (so smoke sorts for it), then captures.
`renderCandleSvg` layers:

- **Wax** (pen 0–5): section slices in the candle's own frame, silhouette,
  optional shading, contours and creases, hidden lines removed by the
  candle-only depth pass.
- **Isotherms** (pen 20+, fire inks): for the sim, the sim's field is read
  back and each flame copy's hottest temperature along every camera ray is
  contoured at `svgIsotherms` levels; legacy flames contour their brightness
  gained over a flame-less render.
- **Smoke stipple** (pen 8): live curl particles as dots, kept by opacity;
  billboard and ribbon smoke (no particles to read) as stipple from the
  brightness they add over a render without them.
- Legacy flames and smoke are found by their `userData.effect` tag;
  `showEffects` toggles the drawables beneath a tag, because the legacy
  flames reset their group's visibility every frame.

## Video

`burn` holds (or drifts by `--orbit`), `snuff` puts the flames out halfway
(the flame fades in 0.45 s, the ember glows and the smoke swells to a
snuffed ribbon), `montage` holds one still per candle, `turntable` circles.
