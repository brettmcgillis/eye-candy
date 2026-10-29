# Argyle

Argyle turns LoaderPatterns' two offset square lattices into a flat plane,
shallow relief or deep extrusion. It also draws the original eleven-square
mark directly from `@utils/argylePattern`; it does not import the dev page or
loader shell. The original 1.5 lattice spacing and 0.75 offset are retained.

## Shared kernel and rendering

`@modules/argyle` is three-free. `lookOptions.mjs` declares look controls with
`@modules/optionSchema`; `renderOptions.mjs` adds shared output controls and
owns the schema every consumer reads. The scene's Leva folders are generated
with `@modules/schemaControls`.

- `layout.js`: upright staggered columns with tapered ends, the original house
  mark, and the optional unrestricted lattice. Column positions remain upright
  independently of the tile angle. A 3-column × 5-row column matches the
  eleven-square house arrangement.
- `generation.js`: preallocated instance data,
  seeded improved Perlin noise, multi-octave sampling, domain warp, layer
  correlation, coverage thresholds, edge falloff, fade treatments and motion.
- `color.js`: nine coordinated palettes plus custom inks; layered, banded,
  radial, noise and checker placement, palette phase and layer contrast.
- `roll.js`: independent layout, field, colour, motion and relief streams;
  held facets and explicit pins apply to reproducible batch/index seeds. Default
  composition is a 9-column × 21-row vertical column. Rolls use upright columns
  80% of the time and the house mark 20%, always at a 45° diamond angle unless
  explicitly pinned. The unrestricted lattice is an explicit composition choice;
  it does not appear in unpinned rolls. All four filled/hollow combinations remain.
  Explicit row/column pins remain authoritative. Frame width is the border's
  fraction of a tile edge, and each layer's style is independently pinnable.
- `framing.js`: front, hero and side views with orthographic or perspective
  projection. Bleed framing crops inside the lattice in front orthographic
  view; panel framing fits the whole arrangement. Logo framing always fits.
- `plotGeometry.js` / `plot.js`: projected vector cube faces, spatially indexed
  hidden-line removal using planar depth, page clipping, ink layers and
  physical hatch spacing. `tileMesh.js` supplies the same solid or hollow tile
  topology to GPU geometry and SVG projection; ring tops suppress construction
  seams, and openings include inner walls in 3D. Outlines and hatches encode partial fades as pen
  density and omit hidden edges; filled artwork uses the unlit palette colours
  and opacity. Filled SVGs are vectors, including in 3D; lighting is raster only.

`@modules/argyleRender` owns `createRig` and `createStage`. The scene, Live tab
and CLI use the same rig, instance transforms and time function. The rig uses
two instanced draws (one per overlapping layer), storage-backed matrices (so a low instance count cannot
select an oversized uniform buffer), preallocated update buffers and reusable
transform objects. It sorts tiles by camera depth for transparency. There are
no external assets, shadow maps or postprocessing passes. Flat mode is unlit;
relief uses the declared shared lighting rig. At 968 tiles the warmed CPU field update measured 0.73 ms median; at 8,192 it
measured 11.86 ms (with a production build running concurrently). These are
field timings, not total browser frame times; maximum density is intended for
export and requires a device-specific interactive check. The scene preserves the app's
renderer tone mapping on unmount and never rebuilds the field for camera edits.

Motion is evaluated from seconds, never wall time: tide, wave, ripple, cascade,
breathe and hinge all close at `loopSeconds`. Perlin travel follows a circle,
so its noise sample, fade, transform and colour return exactly to the start.
The video driver writes complete cycles without duplicating the endpoint;
montage mode holds one frame per generation. Motion can run beneath full
coverage as tile scale, lift and tilt. A stationary complete weave uses tide
with coverage 1 and colour motion 0.

## Surfaces

- Scene: `src/components/scenes/WebGPU/Argyle/`, id `argyle`, WIP, with twelve
  presets covering hollow lower, hollow upper and double hollow tiles, full tiling, dissolving fields, relief, extrusion and logo.
- Workbench: `/dev/argyle` (`ArgyleCLI`), `src/dev/tools/argyle/`, with the real
  stage in its default Live tab. Space pauses; F frames; Capture freezes the
  image and vector plot. The capture sidecar stores the frozen phase, so saving
  that frame as a preset does not restart the animation from an earlier phase.
  Use this camera persists the orbit, target and projection through the render
  form, sidecars and scene-preset camera controls. `cameraFrame` is render-only
  metadata: scene presets contain registered camera control keys, never this
  JSON payload.
  Keep pins the current rolled look. Use the shared
  workbench's saved generations and preset handoff to reproduce a result.
- Server: `src/dev/server/argyle/plugin.js`, through `createSchemaToolPlugin`.
  It offers jobs, saved media, presets and captures under `/dev-api/argyle`.
- CLIs: `scripts/argyle-generate.mjs`, `scripts/argyle-video.mjs`, and the thin
  capturer in `scripts/lib/argyleRender.mjs`, through the shared drivers.

Stills write lossless WebP, SVG and `props.json`. SVG-only batches bypass the
GPU. Video supports MP4 and WebM, including transparent WebM. The batch limit
is 10,000. Every typed look option is a pin; unpinned look options roll.
To render the exact defaults, hold every facet; to vary an existing generation,
use its `props.json` as `--base` and hold the facets to preserve.

```sh
npm run argyle:generate -- --batch edition-a --count 2000 --no-webp --svg --svgStyle hatch
npm run argyle:generate -- --batch relief-a --dimension extruded --views hero --count 12
npm run argyle:generate -- --batch logo-a --pattern logo --coverage 1 --count 12
npm run argyle:video -- --batch loop-a --count 3 --mode loop --mp4 --webm
```

SVGs leave through `out.svg`, receiving shared physical sizing, optional ink
reduction, gallery thumbnails and Open in Plotterizer. Pen plots use their
actual palette ink colours and do not attempt to plot raster lighting. Hatching
represents opacity as density; it treats each visible tile as a pen surface
when suppressing the lines behind it. Filled SVG retains transparency instead.

## Validation

After changing the kernel, renderer, scene, CLIs or bench:

```sh
npm run argyle:check
npm run live:check -- argyle
npm run workbench-chrome:check
npm run overlay:check
```

The pipeline audit covers 2,000 unique deterministic rolls, facet holds, pins,
six loop seams, coverage endpoints, original logo topology, actual Leva key registration for authored and captured presets, schema drift and
all four filled/hollow combinations and three SVG treatments in flat, relief
and extruded orthographic/perspective
views. The Live check builds and captures the shared stage on the real GPU.
Use the human-owned dev server for final visual and mobile performance checks;
never start, stop or restart it from an agent task.
