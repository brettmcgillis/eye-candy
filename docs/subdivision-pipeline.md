# Subdivision pipeline

The Trucheterie arrangement without Dawn: one kernel, the scene, a headless
CLI, and SubdivisionCLI over the CLI. Change the kernel first, land every
consumer in the same commit, and run `npm run subdivision:check`.

```
@modules/subdivision   tree, fields, shade, hatch, SVG, option schema, roll
        │                              │
  WebGPU/Subdivision scene      scripts/subdivision-generate.mjs   fill SVG → sharp → PNG / WebP, plot SVG
  (R3F, Leva, grow loop)        scripts/subdivision-video.mjs      fill SVG per frame → sharp → ffmpeg
                                        │
               src/dev/server/subdivision → src/dev/tools/subdivision (SubdivisionCLI)
```

| Piece                  | Rule                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/subdivision` | **Three-free.** No `three`, React, Leva or `@utils/gradientPalette`; palette stops are passed in and sampled with `@utils/paletteStops`.      |
| `renderOptions.mjs`    | Every knob, declared once. Facets: `structure`, `field`, `palette`. The scene's Leva folders are **generated** from it (`utils/controls.js`). |
| Raster output          | PNG, WebP and video frames are `renderFillSvg` rasterised by sharp; the SVG file is always `renderPlotSvg`. No headless GPU is involved.      |
| The scene              | Draws the same shaded nodes as instances; `grow` (in levels) splits and recombines them on the GPU, so a generation's buffers are built once. |

## The port

The tree is fractalPixelate's bounded per-level split loop
(`src/modules/tsl/fractalPixelate/`) read as the tree it implies: every
fragment of a cell agrees on the split, so the per-fragment loop is a quadtree
(`quad`) or a 4-child trixel tree (`tri`, the same 60° lattice basis). The
drivers are the effect's own — `noise` hashes `cellId * noiseScale + (level *
13.7, seed)` (plus the down-triangle offset), `variance` compares the
children's centres (quad) or the triangle's corners (tri) against
`varianceThreshold`, `focal` is the pointer driver with N attractors and the
radius halved per level.

`cellNoise.js` is a JS mirror of three's `mx_cell_noise_float` (Jenkins
lookup3 `final`) in the GPU's f32 order. It was checked bit-exact against a
Dawn readback over 4096 random coordinates, so a noise tree matches the post
effect at the same seed. The look is the effect's too: per-cell brightness
jitter from the same hash, and the outline band as an inset polygon (quad
inset by `w` on every side, tri scaled about its centroid by `1 - 3w`),
hard-edged so the SVG and the scene agree.

## Rect lattice and holes

`rect` is HyperCubes' rect split in 2D: the root is the canvas (its halves or
quarters under symmetry), cut into four off-centre children. Cells split
unconditionally until no side is longer than `cellSize`, so no square grid
shows; from there `levels` counts the driver's splits (`node.free`).
`driver` still decides whether a cell splits;
`cutDriver` decides where — `hash` (seeded per axis), `median` (halves the
cell's detail, |value − cell mean|, so busy sides come out narrow) or `edge`
(the sharpest jump in the field's line averages). Field cuts read a 10×10
grid over the box. `cutMargin` and `minCellSize` keep every cut off the walls.
Every node carries its folded box (`fbox`), built by the same arithmetic for
a cell and its twins, and child keys follow the folded side, so mirrored twins
get exactly mirrored cuts. HyperCubes' octree has no 2D counterpart
beyond `quad`; its holes became `holeChance`: on any lattice, a cell may stop
splitting and stay empty (a pit in the relief). Holes are leaves, keyed like
the split hash, and are left out of the plot. Rolls and presets leave
`holeChance` at 0.

SubdivisionRelief builds its presets from Subdivision's (same names and
pieces, outline keys dropped, relief and motion added), so the two scenes
stay aligned.

## Canvas

The canvas is the output `width` × `height` in px, and `cellSize`,
`minCellSize` and hatch spacing are px on it — fractalPixelate's own units. The
scene lays the piece out on the viewport in CSS px and scales it to fill, so
the scene behaves like the post effect; `pixelRatio` only resamples a raster.

## Growth: split and recombine

`grow.js` owns visibility and it is a split, not a growth: at `grow = d` the
children of every splitting level-`d-1` cell replace it exactly — in its
colour, with no seams — and over `[d, d+1]` their outline bands open and their
colours move to their own (mixed in linear light). Collapse runs it backwards
into the root grid, so the canvas is always covered; grow 0 is the root grid,
not an empty frame. `renderFillSvg` takes `grow` for video frames and the
scene's cell shader is its GPU twin (each instance carries its parent's
colour). `growSeconds`/`holdSeconds`/`collapseSeconds` are shared by the scene
loop and the `growth` video. The scene's **Loop** off holds the finished piece.

`growStyle: slide` swaps the split for HyperCubes' sliding cut (quad and rect;
tri always splits): each child carries a `from` box — a sliver on the wall the
cut sweeps from, or the whole parent — and grows out of it over its level with
its outline band already open, so the canvas stays covered mid-slide.
`grownCell` is the one CPU rule for both styles and the shaders are its twins.
A hole shrinks away over its level and is gone once it ends, in either style.

## Symmetry

`symmetry` mirrors about the canvas centre: `2-fold` left/right, `4-fold` also
top/bottom. The lattice is re-anchored at the centre (the 60° lattice has
mirror lines through a vertex both ways), so every cell has a twin, and every
decision — the split hash, variance samples, focal distance, colour value,
position, random stop, jitter — reads the folded position. Hashes are keyed by
the folded centroid rather than the lattice id, so `none` alone is bit-exact
fractalPixelate. `subdivision:check` asserts every leaf has a same-coloured
twin.

## Seeds

`seed` names a piece and a batch (`seed`, `seed-1`…); the shapes come from
per-facet numeric seeds — `splitSeed` (structure), `fieldNoise` (field),
`colorSeed` (palette) — so holding a facet really holds it while the others
roll.

## Plot SVG

One Inkscape layer per palette stop (`pen-N`), then `pen-outline`. Hatch
spacing comes from the cell's lightness in 8 bands and runs on global offsets,
so neighbouring cells of one pen continue each other's lines; hatches and
outlines are both stored as (angle, offset, interval) and merged, so a shared
edge is one stroke. Lines alternate direction for the pen. The plot SVG has no
background rect (a plotter would trace it). The plot options are CLI and
workbench only (`scene: false`); `plotOptionsFrom(options)` hands them to
`renderPlotSvg`, since a rolled config carries scene keys only.

## Source images

`field: image` reads `sourceImage`, a path under `public/`. The workbench
uploads to `public/images/subdivision-sources/` (content-addressed, via
`/dev-api/subdivision/sources`, the one route with a large body limit) and
stores the path; the CLI also takes a plain file path. The scene has its own
**Upload image** control (a blob URL, so not saved in a preset) and a
**Webcam source** that re-subdivides a mirrored frame `webcamRate` times a
second and holds the loop. Luma is taken over white, so a shape carried only
by alpha reads. Images decode to at most `SOURCE_IMAGE_MAX` a side (sharp in
Node, a canvas in the scene); the resamplers differ slightly.

## Definition of done

- `npm run subdivision:check`
- `npm run lint:fix`
- `npm run subdivision:generate -- --count 1`
- `npm run subdivision:video -- --count 1 --pixelRatio 1`
- The scene still renders in the browser (human eyeball).
