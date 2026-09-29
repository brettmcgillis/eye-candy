# Kumiko pipeline

Kumiko follows Fungi's arrangement (`docs/fungi-pipeline.md`): one kernel,
two renderers, and a dev tool that is a UI over one of them. Change the
kernel first, land every consumer in the same commit, and run
`npm run kumiko:check`.

## The shape

```
@modules/kumiko        tilings, pattern catalogue, mixing, arrangement → panel, SVG, option schema
@modules/kumikoRender  baked cells as instances, TSL wood/paper, frames, rig, lights, camera, palette
        │                              │
  WebGPU/Kumiko scene          scripts/lib/kumikoRender.mjs
  (R3F, Leva, worker)           └─ kumiko-generate.mjs   flat PNG/WebP, SVG, 3D stills
                                        │
                   src/dev/server/kumiko → src/dev/tools/kumiko (KumikoCLI)
```

| Piece                   | Rule                                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/kumiko`       | **Three-free** (it may import `@modules/flora`'s barrel for `createRng`). Runs in the scene's worker and in Node. Emits a 0–1 tone, never a colour. |
| `@modules/kumikoRender` | The only home of the 3D look. `createPanelRig().setPanel(buildLeaves(…))` draws a panel; the scene and the CLI share it.                            |
| `renderOptions.mjs`     | Every knob, once. Facets: `layout`, `patterns`, `mix`, `palette`. The scene's Leva builders are hand-written and held to it by the check.           |

## The panel

Millimetres, y down. A cell is a regular polygon from one of eight
Archimedean tilings (`tilings.js`; unit cells plus gap triangles found as
unit-edge vertex triples). A pattern (`patterns.js`) is written once for any
regular n-gon: asanoha on a triangle is yotsu-bishi on a square.

Per tiling cell, `planCell` gathers width-tagged segments: the cell's jigumi,
any subdivision's finer jigumi, each leaf's infill. `arrangement.js` splits
them at crossings, sorts strips round every node, and intersects neighbouring
strip sides into **corners**. Corners give both the **openings** (faces inset
by each edge's own half-width) and the **pieces** (a strip between two nodes,
mitred along node→corner lines — the joinery cut). A face whose inset
collapses has no opening and is solid wood (`solids`).

A pattern must be connected to its cell: a floating ring is a face with a
hole, which the arrangement does not model and a joiner could not build
(`masu` ties its box to the jigumi for that reason).

## Mixing

- **Pool** — one boolean per pattern (`useAsanoha`…); a panel of one type up
  to every type. A seeded ranking with `poolSkew` weights the favourite.
- **Zones** — each zone (and each nested-frame ring) has a favourite per cell
  shape; `zoneMix` is the chance a cell rolls from the pool instead.
- **Subdivision** — tri→4, quad→4, hex→6 triangles, to `subdivide` levels;
  jigumi thins by `levelThinning` per level; `childMix` rerolls children.
- **Nested frames** — rectangular inner frames that cut every opening.
- **Symmetry** folds positions before any dice, so mirrored cells match.
  A mode only holds on a tiling that has it about its centre: 4-fold
  (`rotate4`, `kaleido4`) on square / truncated-square, 3- and 6-fold on the
  triangle / hex family, mirrors on neither snub square (chiral) nor a grid
  turned off its axes. The roll only picks modes the rolled tiling has.
- **Connectivity** — a pattern must hang from its cell's jigumi;
  `auditPatterns()` (run by `kumiko:check`) fails any pattern that leaves a
  strip floating on any cell shape.

## 3D: a baked catalogue, instanced

There is no CSG. Every leaf is a regular 3/4/6/8-gon, and its strips depend
only on its pattern, side count, edge length, level and the widths of its
sides — so `@modules/kumiko/catalog.js` bakes each distinct cell once, in
its own frame, and a panel is a list of placements (`buildLeaves`: centre,
angle, entry key, tone, image stats). Side widths are rotated to their
smallest reading so every turned copy of a cell shares one entry; ice-ray
gets four seeded variants.

- A baked cell carries **its own half of each jigumi side**, mitred at its
  corners. Neighbours meet exactly on the centreline and the wedges round a
  vertex tile it, so joints are seamless with no panel-wide solve. A child on
  its parent's side keeps the parent's width (`edgeWidths`).
- Paper is baked per face out to the strip centrelines: an infill strip
  stands forward of the paper, and from any angle you see under its edge.
- `@modules/kumikoRender/cells.js` draws each entry as a wood and a paper
  `InstancedMesh` sharing a storage-backed `instanceMatrix` (a uniform one
  breaks past 1024 instances) and per-cell `cellData` (tone, random, fade,
  luma) + `cellSource` (image colour).
- Colour is all shader: the palette is a LUT texture, and tone, shift,
  repeat, colour target and `size` / `random` / `source` modes are uniforms
  over baked per-face attributes. Palette and colour edits never touch
  geometry. Grain reads the raw cell-local position (`positionGeometry`;
  `positionLocal` is already instanced) along each piece, or one world
  direction for `slab` (one plank).
- Cells are tracked by position. A cell whose entry changes eases out
  through the paper while its replacement rises (`cellEase`).
- Cells run on under the border to the panel's edge and are discarded past
  it.

Timings (Node): `buildLeaves` ~5 ms warm for a default panel, 12–18 ms with
an image; the scene plans in a worker, bakes on the main thread (~1 ms per
new entry), and only updates instance buffers per frame.

## Image modes

`imageMode` `subdivide` splits a cell where the image under it is busy
(spread over 13 samples > `0.3 − 0.28·imageDetail`). `halftone` does that
and picks each cell's pattern by openness: the pool, filtered to the cell's
shape, is ranked by measured open area (`openness.js`, on a real cell of that
level) and the cell's brightness (± `halftoneDither`) picks along the ramp;
the darkest cells also subdivide, since finer lattice is more wood. The
backlit paper then shows the picture as light. `colorBy` `image` runs the
palette by brightness, `source` uses the image's own colour. The scene takes
`sourceImage` (under public/) or the webcam (`@hooks/useWebcamFrame`); the
CLI decodes `--sourceImage` with sharp.

## Outputs

`--views flat,front,angle,raking`: `flat` is the SVG fill art rasterised by
sharp, the others headless WebGPU renders of the rig. `--svg` writes
`panel.svg` in `--svgStyle`: `fill`, `plot` (opening outlines, one group per
palette stop — pens), or `pieces` (every strip outline by tier — a cut list).

## Definition of done

- `npm run kumiko:check`
- `npm run lint:fix`
- `npm run kumiko:generate -- --count 1 --views flat,angle --svg`
- The scene still renders in the browser (human eyeball).
