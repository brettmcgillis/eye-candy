# Imperfection pipeline

A TSL port of the Imperfection Shadertoy bundles (full, lite, wild), in the
Apollian arrangement: one kernel, one render module drawn by the scene and the
headless CLIs, and ImperfectionCLI over the CLIs. Change the kernel first,
land every consumer in the same commit, and run `npm run imperfection:check`.

```
@modules/imperfection        three-free: the reference composition verbatim,
                             lite/wild presets, layout warp, OkLCh family
                             shifts, paintingData, roll, option schema
@modules/imperfectionRender  the TSL port: nodes/{common, field, zones, smear,
                             blocks, heroes, wet, accents, grade, lite, passes},
                             uniforms, createPaintRig
        │                              │
  WebGPU/Imperfection scene     scripts/lib/imperfectionRender.mjs
  (R3F, Leva generated)           ├─ imperfection-generate.mjs   stills per view
                                  └─ imperfection-video.mjs      seamless loops
                                        │
         src/dev/server/imperfection → src/dev/tools/imperfection (ImperfectionCLI)
```

| Piece                         | Rule                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@modules/imperfection`       | **Three-free.** May import only `@modules/flora` (`createRng`). `imperfection:check` enforces it.                                                            |
| `@modules/imperfectionRender` | The only home of the look. `createPaintRig().apply(config, { time, view })` is what the scene and the CLI both call.                                         |
| `renderOptions.mjs`           | Every knob, once; defaults are the full bundle's constants. Facets: `layout`, `palette`, `paint`, `field`, `blocks`, `wet`, `accents`, `grade`, `motion`.    |
| References                    | `WebGPU/Imperfection/references/` holds the three bundles verbatim. Source and licence unconfirmed (the hashes are Dave Hoskins', MIT) — see the scene todo. |

## The port

The reference is a smear field: one colour source (two Shepard families of
anchors with a hard warm/cool switch, plus authored rectangles), and every
block, drip, hatch and grain comes from distorting the lookup into it. The
port keeps that shape function for function:

- **full** — Buffer A is an RGBA16F `rtt()` of L1 + L2 whose alpha packs the
  topmost paint's grain direction, kind and wetness as an exact integer; the
  Image pass runs the 12-tap bilateral wet smear over it, then the dry marks
  (wedge, soot, ink scratches, red drips and flecks), glow and grade.
- **lite** — one pass, one field lookup per pixel: wet segment ends instead of
  the buffer smear, one living block grid, crisp heroes, wedge and soot only.
- **wild** — lite with fifteen constants changed; a preset (`WILD`), not code.

Rules the port follows:

- Every GLSL function is a `Fn(...).setLayout(...)` (Metal will not compile
  the inlined graph); multi-output GLSL functions (`smearFlow`,
  `directionField`, `blockGrid`, `liteSmear`) are inline JS builders called
  inside a laid-out Fn. Early returns become flags combined at the end; only
  the expensive paint jobs stay behind an `If`.
- GLSL `mod` is `fmod` (floor-mod); TSL's `mod` truncates.
- Laid-out Fns are cached per Fn object with their uniform names, so each
  pass builds its own library (`passes.js` `createLibrary`) — never share a
  laid-out Fn between Buffer A and the Image pass.
- The shader works in bottom-left fragCoord like the reference
  (`screenSize.y - screenCoordinate.y`); an `rtt` texture is addressed by
  top-left screen coordinates, so reads of Buffer A flip y once.
- The reference encodes with `pow(c, 1/2.2)`; the port hands the renderer
  `sRGBTransferEOTF` of that, so the renderer's sRGB output lands the same
  bytes. Tone mapping is off (`useFlatToneMapping`, and in the capturer).

## Fidelity

Checked against the original GLSL in WebGL2 (Chrome, t = 0, 512²), layer by
layer: the colour field (L0) matches to within 2 levels (mean 0.07). The
smear, blocks and accents match in structure, but individual hairlines,
segments and blocks draw different hash values. That is float contraction,
not the port: the reference hashes computed inputs (`strand * 1.37 + seed`,
`strand * 5.91 + seed * 3.3`, …), and ANGLE and Dawn fuse those multiply-adds
differently, so the last bit differs and the hash amplifies it. Hashing the raw
integers in both shaders drops the mismatch from 85 % to 11 % of pixels. The
same GLSL differs the same way between GPUs; do not chase it.

## Variations

The reference composition is never edited. A roll moves:

- **layout** — a separable piecewise-linear warp through three knots per axis
  (warm column edges and the cool seam across u; band and core top up v).
  Anchors and rectangles are moved forward on the CPU (`paintingData`); every
  zone box is read through the inverse warp in the shader (`zone`). `mirror`
  flips the painting coordinate in the Image/lite pass only. The default
  layout sets `warpOn = 0`, so the reference is bit-exact.
- **palette** — per-family OkLCh hue turn, chroma and lightness on the anchors,
  rectangles and accent colours. Windows stay on the warm (r > b) and cool
  sides, because `shade`, `warmShift`, `hueThread` and the wet pass's family
  test all read r − b.
- **paint / field / blocks / wet / grade** — windows bracketing full..wild.
- **paintSeed** — added to every hash input; 0 is the reference.
- **phase** — where in the 32 s loop a still is taken; 0 is the judged frame.

## Beyond the reference

Everything below is off by default; the reference stays byte-identical
(`imperfection:check` and the baseline renders guard it).

- **Compositions** (`composition`). `reference` is the authored painting,
  its zone literals hard-coded in the shader. `cross`, `horizon`, `portal`,
  `burst` and `columns` are archetypes (`compositions.js`): each returns a
  structure — warm masses, band, columns, core, hatch and drag regions, wedge,
  soot — and `compileStructure` (`structure.js`) turns it into 36 warm and 47
  cool anchors, 11 rectangles and zone data in fixed slots (`ZONE_SLOTS`).
  The shader picks `nodes/zoneSet.js`'s reference or generated zone set at
  build time; every consumer (field, blocks, lite, wet, accents, grade) reads
  zones through it, never through literals.
- **Block engines** (`blockEngine`). `grid` is the reference's jittered
  grids; `quadtree` and `rect` split each layer's cell per pixel
  (`nodes/cells.js`, fractalPixelate-style, no buffers), optionally splitting
  more where the density map wants blocks. Scale, amount, layers and fill vary
  count and coverage for every engine.
- **Motif** (`motif`: `logo`, `tiled`). `@utils/argylePattern` read in a
  45°-turned motif space: unit squares on a 1.5 lattice (red) and the same
  lattice offset by 0.75 (black, on top). Logo keeps the eleven; tiled repeats
  both lattices, eaten by a per-square fbm (whole sections) plus ragged edge
  noise, and faded per square. Filled or outline; placed in the field (the
  smear drags it), as blocks (crisp, grain along the diamond's edges), or
  both. `motifBuild` wipes the logo in by the loader's BUILD_ORDER.
- **Palettes** (`paletteName`, `paletteMix`). A gradients.json palette is split
  into warm and cool families by r − b and sorted by OkLab lightness; each
  anchor and rectangle takes the palette colour at its own relative lightness
  within its family, then the family's OkLCh shift. A family the palette
  lacks keeps its colours.
- **Image source** (`fieldSource: image`). The field reads `sourceImage` (or
  the scene's webcam) instead of the anchors, cover-fitted, family by r − b;
  the composition still supplies the zones. Frames are RGBA bytes, row 0 on
  top, handed to `rig.setSource` by the scene (canvas decode, webcam) and the
  CLI (sharp) alike. This is the path Untitled1's render will take.
- **Impasto** (`impasto…`). The finished paint's lightness as height, lit by
  a raking light with a wet gloss; screen derivatives, so it runs at the pass's
  top level (WGSL forbids derivatives in non-uniform control flow).

WebGPU allows twelve uniform buffers per stage: anchors, rectangles and zones
each pack into one vec4 `uniformArray`, read through views (`uniforms.js`).

## Views

`painting`, `field` (L0 alone, the SHOW_FIELD debug), `wetness` (wetness in
grey, grain direction as hue: red 0°, yellow 45°, green 90°, blue 135°) and
`blocks` (BLOCK_DEBUG: living blocks green, wipes magenta, slides cyan, hero
sweeps yellow, unsmeared). Lite has no buffer, so its `wetness` and `blocks`
views are the painting. `wetLic` is WET_LIC: each wet tap walks on along the
grain under it; it is a material switch, not a uniform.

## Definition of done

- `npm run imperfection:check`
- `npm run lint:fix`
- `npm run imperfection:generate -- --count 1 --png`
- `npm run imperfection:video -- --count 1 --loopSeconds 4`
- The scene still renders in the browser (human eyeball).
