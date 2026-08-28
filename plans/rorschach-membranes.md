# Rorschach membranes ("wing mode")

Stretch a surface across a bundle's strands — the canopy over the kite's sticks.

## Why it works

A bundle is already a surface control net. `generateStructure` seeds
`strandsPerBundle` strands from one origin and integrates them all through the
same field for the same `steps`, so `(u = strand index, v = step index)` is a
parametric grid, already resident as Float32Arrays and already streamed by
`growBundle`. The membrane is a second mesh over the same numbers — no new
simulation.

`buildStrokeGeometry` interleaves segments step-major so one `setDrawRange`
grows a bundle in lockstep. A membrane index buffer built the same way inherits
growth, reveal, and evolution for free.

## Why strands get reseeded

Measured over 18 bundles (6 seeds x 3), sorting the existing RNG-scattered
start points into a spatial order (PCA of the start cloud) and lofting them:

| seeding             | median fixed/greedy | scrambled (>2) | median width |
| ------------------- | ------------------- | -------------- | ------------ |
| scatter+PCA, t=0.35 | 1.59                | 7/18           | 2.2          |
| scatter+PCA, t=1.0  | 2.16                | 12/18          | 9.9          |
| line seed, t=0.35   | 1.00                | 0/18           | 0.8          |
| line seed, t=1.0    | 1.00                | 0/18           | 0.8          |

(`fixed/greedy` = path length through strands in fixed order vs. greedy
nearest-neighbour order at that step; 1.0 means the order is still spatially
correct, >2 means the ribbon self-crosses and the loft is crumpled.)

Two-thirds of scatter bundles crumple by the tail. Seeding strands evenly along
a line through the origin makes adjacency correct by construction — the flow is
smooth, so a seed line maps to a smooth curve at every step. It is also less
code than the PCA sort it replaces.

Seed-line length (`membraneSpan`) is a real knob, decoupled from `startSpread`,
which at 0.35 yields a thin streamer rather than a wing:

```
span 0.35  width  0.8   ratio 1.00   scrambled 0/18
span 1     width  2.4   ratio 1.00   scrambled 1/18
span 2     width 13.9   ratio 1.10   scrambled 1/18
span 4     width 20.4   ratio 1.09   scrambled 0/18
span 8     width 21.6   ratio 1.15   scrambled 0/18
```

Coherence holds all the way out; width saturates near the attractor's own
extent. Usable range 1–4.

## Decisions

**Seeding is its own control, not the membrane toggle.** `strandSeeding:
scatter | line`. Welding them means turning the sheet on silently changes the
bundle's _lines_ too, so canopy-on/canopy-off could never be compared on one
scaffold. Line-seeded bundles are worth having on their own.

**Tear, don't stretch.** A quad whose edge exceeds `tearDistance` fades out
(attribute -> TSL opacity). Torn canopies read as wings; it also kills the
outlier-triangle artefact when a strand does eventually wander.

**No NURBS.** `v` is already dense and smooth (RK4 of a smooth field, 600–2000
samples); only `u` is coarse. A `NURBSSurface` + `ParametricGeometry` costs a
CPU re-evaluation every frame, and growth _and_ evolution rewrite this data
every frame. At span 2–8, `maxGap/width` runs 0.6–0.8, so facets are real —
fix it first with a higher membrane strand count (a slider), and only add a
degree-3 B-spline across `u` (constant basis weights = one precomputed
samples x strands matrix) if it still reads faceted.

**Normals from derivatives.** `dFdx`/`dFdy` of view position in TSL, not a
normal attribute — free, always correct, no extra buffer writes during growth.

## Gotcha

`generateStructure` sizes the shared display scale off the largest `maxDist`
across all bundles. A span-4 membrane bundle is ~20 wide against a typical
`maxDist` of 9–17, so raising span visibly shrinks the whole beast. Correct,
but surprising.

## Landed

Kernel: `membraneGeometry.js` (indexed, step-major, both sheets in one buffer),
`line` seeding in `testGenerator.js`, `strandSeeding`/`membraneSpan`/`membrane`/
`membraneOpacity`/`membraneTear` in `renderOptions.mjs`, `Membrane` +
`StrandSeeding` + `MembraneSpan` per-bundle fields in `overrides.js`.

Renderers: `TestMembrane.jsx` in the scene, membrane meshes in
`scripts/lib/gpuCapture.mjs`. `buildTest` now takes `options` alongside
`config`, since these knobs are not rollable and so never appear in a rolled
config — the roll still wins wherever it has an opinion.

UI: Structure and Layers controls in `useSceneControls.js`, per-bundle slots in
`buildBundleOverrideSchema.js`, fields in the workbench page.

## Deferred

**SVG.** `renderTestSvg` is line-work only, so this ships GPU-only with a row
added to the pipeline doc's divergence table (precedent: ink). Phase 2 is
`svgMembrane: none | outline | fill` — and outline is nearly free _because_ a
line-seeded sheet does not fold: its silhouette is its parameter-domain
boundary, i.e. the two edge strands plus the two end rows. Four polylines, no
polygon union, still a plotting format. (A ribbon twisting toward the camera
will self-cross; on a plotter that reads as a feature.)

**Ink outline in SVG.** Probably never. `computeField` is TSL — it builds a
node graph, it does not evaluate to CPU numbers — and `createInkPaper` needs a
real renderer. `renderFrameSvg` is sharp-only, which is the property that makes
it the fallback. A contour costs either booting the GPU inside svg mode or a
CPU reimplementation of the pattern field, which is the duplication pipeline
rules 1 and 3 exist to prevent.

**Membrane step stride.** Only matters at the 2000-step presets.
