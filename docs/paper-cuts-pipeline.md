# Paper Cuts pipeline

Painted presets and shared brush maps: [Painted variants](painted-variants.md).

PaperCuts keeps its three authored `frameData` designs and adds **Generated**
to the same scene's Data selector. PaperCutsCLI (`/dev/paper-cuts`) rolls the
same generator and draws the same relief and folded-frame geometry.

## Ownership

- `@modules/paperCuts` is three-free: seeded generation, placement geometry,
  facet rolling, framing, SVG and `renderOptions.mjs`. That option table
  generates the scene's Leva folders, CLI flags and workbench form.
- `@modules/paperCutsRender` owns `createPaperRig` (instanced paper and
  animation) and `createPaperStage` (the Live/headless studio). Import its
  barrel. The scene mounts the same rig through its local `Relief` component.
- `@elements/Paperframe` owns the actual `FoldedFrame.glb` geometry and
  material factory. `PaperFrame` and the headless stage both use
  `createFrame`; never approximate the frame with replacement geometry.
- The three authored designs live in `@modules/paperCuts` under `authored/`.
  The scene and Designer read the same immutable data through the barrel.
- `scripts/paper-cuts-{generate,video}.mjs`,
  `scripts/lib/paperCutsRender.mjs`, `src/dev/tools/paperCuts/` and
  `src/dev/server/paperCuts/` are adapters over these modules.

## Grammar

Sizes are 1, 2 and 4; positions lie on a quarter-unit grid. Each motif starts
with a small front square and nests larger squares behind it. New motifs
branch from exposed corners, with cardinal branches added by the radial
family. Constellation starts from opposed centres; diagonal favours the
main diagonal. Optional bridges link nearby motifs at the back.

Every placement accepts a complete half-turn or quarter-turn symmetry orbit.
Squares cannot overlap within one layer, leave the configured extent, or
lose more than 85% of their area to nearer paper. A new foreground placement
also checks that it does not hide an existing deeper piece. Branches and
nests must overlap nearer paper. The budget is 160 pieces. Empty layer slots
are compacted while retaining front-to-back order. Seed and controls fully
determine the result; there is no component-local generation randomness.

A layer's z step is thickness plus gap. The normalized relief fits the
existing scene's 3.5-unit half extent, matching its authored-frame fit.
Static work and fades use one instanced mesh per layer. Morse uses a
separate material per square so a pulse cannot light its entire layer.
Animation mutates the rig directly without React frame-loop state updates.

## Outputs

Stills write WebP and/or SVG with a reproducible `props.json`. The SVG draws
the paper relief only, projected through the selected camera. Ray/box tests
remove hidden edges, including side edges in angled views. Each depth layer
is a pen layer. Default plots use dark ink; SVG colours uses the paper's
layer colours. **Edges** includes front, back and side edges; **Faces** traces
only front-face outlines, with the same occlusion checks. The decorative frame
is excluded from plots.

Video modes are montage, relief (a looping expansion of the layer gaps),
and turntable. Layer Fade and Morse can run in these clips as well. The Live
tab supports orbit, pause, roll, pinning and capture through the shared
LiveStage/capture pipeline. Captures retain their current camera in their
pixels and SVG; saving a scene preset restores the composition and look.

The scene's art/frame placement and camera remain its own scene controls;
the bench fits its camera around the full work. Authored scenes retain their
existing city environment. Generated work uses the directional/ambient studio.

## Palettes and manual designs

Paper colours use the shared gradient registry through `@utils/paletteRegistry`
and the three-free `paletteStops` sampler. Rolls choose across the full library;
exact/reversed sampling and manual endpoints (`None`) are available. The scene's
Roll palette action holds the geometry fixed.

PaperCutsDesigner (`/dev/paper-cuts-designer`) follows the TrucheterieDesigner
arrangement. `@modules/paperCutsDesigner` owns the editor and undo history;
`@modules/paperCuts` owns the versioned design model, validation and `pc1.` codec.
Designs allow 512 squares across 32 layers, quarter-grid coordinates, sizes 1/2/4
and no overlaps within one layer. Different layers may overlap freely. Layer 1
is nearest the viewer. Empty depth slots are retained.

The Designer starts blank, from any authored design, or from a seed. Place,
select, move, duplicate, erase, reorder layers, edit coordinates, undo/redo, pan
and zoom operate on immutable layouts. The 3D preview uses the shared rig. Saved
JSON holds geometry and rotation; preview colours remain separate so the bench
can roll the look without changing the design.

The dev-only API validates names and layouts and saves JSON under
`src/modules/paperCuts/designs/`. Saved names appear in the bench; its Designer
link opens the selected layout. The scene's Design your own action passes its
current composition as a code. `paperDesign` accepts a code in the scene and a
saved name, JSON path or code in the CLIs. For example:

```sh
npm run paper-cuts:generate -- --paperDesign paper-designer-study --svg
```

Manual geometry is pinned during rolls, including Live, stills and videos. Clear
Design in the bench or Roll composition in the scene to resume seeded layouts.

## Validation

Run `npm run paper-cuts:check`, `npm run live:check -- paperCuts`,
`npm run workbench-chrome:check` and `npm run overlay:check` after changing
this pipeline. The generator check covers 144 seeds across all families and
symmetries, including grid, size, layer overlap, visibility, bounds and
repeatability. Inspect real stills, video and SVG alongside the existing dev
server; the human owns that server. No unit-test framework is used.
