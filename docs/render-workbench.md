# Render Workbenches (Required)

How a generator's one option table reaches every surface: the CLI, the
scene's Leva panel, the dev workbench and the dev server. Each pipeline doc
(`docs/*-pipeline.md`) describes its kernel and look; this doc is the shared
plumbing they all sit on. Follow it for every new generator.

```
@modules/<kernel>/renderOptions.mjs   ← one spec per knob (@modules/optionSchema)
   ├── scripts/<slug>-{generate,video}.mjs   runStills / runVideo
   ├── <Scene>/utils/controls.js             Leva via @modules/schemaControls
   ├── src/dev/tools/<tool>/<Tool>WorkbenchPage.jsx   RollWorkbench config
   └── src/dev/server/<tool>/plugin.js       createSchemaToolPlugin config
```

## 0. Core requirements for every bench

A new bench ships with all five, designed in from the kernel up rather than
bolted on. The user is asked at scene kickoff whether the scene gets a bench at
all (`docs/scene-conventions.md` §17); once it does, these are the default scope.

1. **Randomization (roll).** Unique images in bulk must be a one-command job:
   - Every look-defining knob is `rolled(facet, [min, max] | null, …)` (or
     `inFacet`) with a sensible window, so `count` generations from one `batch`
     seed each differ and are reproducible. Design the kernel so the whole
     generation is a pure function of `(options, seed)` — no hidden
     `Math.random`, no wall-clock input.
   - The bench exposes roll and `count` (RollWorkbench does); a typed flag pins
     a rollable option, everything else rolls.
   - Every generation writes its `props.json` sidecar so any image can be
     reproduced, saved as a scene preset, or re-rendered at another size.
2. **Video.** `scripts/<slug>-video.mjs` via `runVideo` is part of the first
   cut, not a follow-up: at least `hold`, `fps`, and a `montage` mode that cuts
   one generation after another; plus the scene's own motion (grow, turntable,
   drift, loop) when it has any. The kernel must therefore expose its time
   parameter (see the TSL `time` / `setClock` note in § 5).
3. **SVG output for pen plotting.** The kernel provides a plot (`plot.js`,
   three-free where possible, built on `@modules/plotKit`) with pen layers, and
   `runStills` writes it through `out.svg` so `plotWidthMm`, thumbnails and
   **Open in Plotterizer** come free. If a look has no honest line
   equivalent, say so at kickoff and agree the nearest plot (outline, depth
   contours, shade hatching, section cuts) rather than silently omitting it.
   Every plot can come out in colour: `standard.svgColors()` (0: as drawn,
   1–8 inks) and `writePlot` regroups any SVG into that many ink layers from
   the plot's own colours (plotKit `inkLayers`, below), so a kernel's job is
   to draw each line in its real colour. A plot drawn from read-back pixels
   takes its colours from the unlit albedo (`docs/dumpster-fire-pipeline.md`
   § Colour plots); one whose colours the kernel knows (GhostBuster's skin)
   names them per layer.
4. **A Live tab.** The bench's first tab (`leadingTabs`) mounts the real stage
   in the page so the exact image is found by hand: orbit, pause, tweak the
   form's options live, then **Capture** the frozen frame. Without a Live tab
   the only route to a specific image is rolling and hoping.
   - The Live tab mounts the same stage the CLIs mount headlessly, so Live
     and render never diverge. An R3F stage (`@modules/renderStage`,
     `createStageRoot`) has its own `Live<Tool>.jsx`: `LiveGhost`,
     `LiveFlock`, `LiveDumpster`. A three-only stage lives in
     `src/modules/<tool>Render/stage.js` (or `bench.js` where `stage.js`
     is taken) as `create<X>Stage({ renderer, readFrame, width, height,
pixelRatio, samples, shadows, transparent, … })` — browser-safe,
     setting its own tone mapping and shadows, drawing through
     `readFrame(draw)` — beside the bench's `rollArgs`, generation builder
     and framing. The CLI's capturer is `createHeadlessRenderer` plus that
     stage; the page's is `src/dev/renderWorkbench/LiveStage.jsx` over
     `src/dev/tools/<tool>/live.js`, passed as
     `leadingTabs={liveTabs(live, '<tool>')}` with `defaultTab="live"`.
     Bespoke pages use the same pair directly on `ResultsPanel` and pass the
     complete pin context (`{ pins, setPins }`) so **Keep** updates the form.
   - `live.js` exports `{ createStage, generate, frame, configOf, name }`
     and optionally `load` (a generation the build re-rolls, or a stage
     with its own load arguments), `keep`, `cameraKeys`, `stageKey`,
     `flat` (pan and zoom, no orbit; may be a function of the options),
     `checks` and `hint`. A stage may add `settle(options)` (after every
     load), `step(delta)` (each unpaused frame) and `captureDepth` /
     `depthProbe` (passed as `svg`'s `visible` when `svgOcclusion` is on).
     Images and SVG rasters come in through injected `loadImage` /
     `rasterize` (a canvas in the page, sharp in Node); a flat SVG bench
     can use `@modules/renderStage/svgStage`.
   - It reads and writes the form (`context.options`, `setOption`): **Use this
     camera** writes the orbit back as camera keys (and reframes from
     them on the next load, so the offset is not applied twice), sliders and buttons write
     the generation's options, Space pauses, F frames the subject.
   - Capture renders the frozen frame at the form's size offscreen, plus the
     plot from the same stage, and posts to `/captures` (`liveCapture.js`,
     `src/dev/server/renderJobs/liveCapture.js`; the route exists when the
     schema has `standard.capture()`); `runStills` finishes `--capture <dir>`
     like any still (formats, overlay, sidecar), no kernel, no GPU.
   - `npm run live:check [tool…]` runs every `live.js` headlessly (build,
     roll, frame, capture, plot; one process per bench) and fails on a flat
     frame or an empty plot; `workbench-chrome:check` fails a bench with no
     Live tab.

5. **One set of outputs.** Stills write WebP (lossless) and SVG; video
   writes MP4 and WebM (`...standard.videoFormats()`), ticked like the
   image formats. There is no PNG output — PNG is only internal plumbing
   (Live-capture upload, thumbnails, overlay). Transparency is not a format
   but a feature of the output: `standard.transparent()` (section `output`,
   both kinds) clears the capture to zero alpha with no background
   (`setBackdrop` in `headlessWebgpu.mjs`; a rig tags the world it draws
   round the subject `userData.backdrop = 'shadow'` — a floor or wall that
   keeps only its shadows — or `'hide'`), and every post pass keeps alpha
   (glow brings its own: `withGlow` from `@modules/postRig`). WebP and WebM (VP9 `yuva420p`)
   carry the alpha, and MP4 is laid over the background colour
   (`runVideo`'s `background(options)`, else the kernel's background key).
   The workbench's `FormatPicker` shows the formats for the kind plus the
   Transparent toggle. `npm run workbench-chrome:check` enforces this; a bench
   whose subject fills the frame (Imperfection) is listed in its `FULL_FRAME`
   instead of offering Transparent.

Items 1–4 are not yet enforced by a script (`checkWorkbenchPage` and
`workbench-chrome:check` don't look for them); review them by hand when adding
a bench.

## 1. Declaring options — `@modules/optionSchema`

One way to write a spec. Import the builders from
`../optionSchema/index.mjs` (relative: the file must load in plain Node and
in Vite's config loader, so it stays dependency-free).

| Builder                                                                  | Makes                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `num(section, group, label, value, min, max, step, extra)`               | a scene number control                                                                                                                                                                                                                                                                                                                                                                             |
| `choice(section, group, label, choices, value, extra)`                   | a scene enum (`choiceLabels` names its choices)                                                                                                                                                                                                                                                                                                                                                    |
| `flag(…)`, `color(…)`, `spec(type, section, group, label, value, extra)` | a scene boolean, colour, or anything else                                                                                                                                                                                                                                                                                                                                                          |
| `rolled(facet, [min, max] \| null, item)`, `inFacet(facet, item)`        | lets the dice set it (in that window)                                                                                                                                                                                                                                                                                                                                                              |
| `sceneOnly(item)`                                                        | a scene control that is never a render option                                                                                                                                                                                                                                                                                                                                                      |
| `rigOf({ facet })`                                                       | a builder for light/post rig keys (`rig: true`, section `post`)                                                                                                                                                                                                                                                                                                                                    |
| `output`, `still`, `video`, `render`, `roll`                             | scope/section wrappers for literal render options                                                                                                                                                                                                                                                                                                                                                  |
| `standard.<key>(…)`                                                      | the shared render options: `batch`, `out`, `width`, `height`, `pixelRatio`, `count`, `webp`, `svg`, `transparent`, `mp4`, `webm`, `videoFormats`, `plotWidthMm`, `views`, `svgStroke`, `svgPenMm`, `svgOcclusion`, `samples`, `shadows`, `projection`, `fov`, `margin`, `keep`, `base`, `palettes`, `mode`, `view`, `fps`, `hold`, `turns`, `orbit`, `overlay`, `ig`, `viewport`, `overlayOptions` |

`group` is the dotted folder path inside the section, or `null`. Every builder
takes `extra` last and spreads it, so any field can be overridden. A kernel
may define named compositions of these (Flora's `gen`, Brutalist's
`forest()`), never its own copies of them.

`createOptionSchema({ options, sectionLabels, surfaceDefaults, views,
configKeys, validate })` returns the CLI/workbench surface (`defaultsFor`,
`normalizeOptions`, `usageFor`, `optionsFor`, `sectionsFor`, `facets`,
`keysInFacet`, `canonicalArgv`, `withAliases`) and the scene adapters
(`SCENE_KEYS`, `LEVA_KEYS`, `GENERATOR_KEYS`, `keysWhere`, `sceneDefaults`,
`configFrom`, `optionsFromConfig`, `presetFromConfig`, `sceneNameFor`,
`sceneNamed`, `resolveViews`, and `SCENE_NAMES` / `LEVA_NAMES` /
`SCENE_OPTIONS`, the same scene keys under their `sceneKey` names).
Re-export what consumers use; don't rewrite them.

- `normalizeOptions` already checks that a still has an image format, that
  width × pixelRatio fits 8192, and (given `views`) that `views` names real
  views. `validate` is only for the kernel's own rules.
- `sectionLabels` lists only labels that differ from the section id. `roll`
  is always "rolling" and `color` always "colour"; a light/post rig section
  is "post" (post only), "light" (lights only) or "light & post" (both).
- `configKeys` narrows which scene keys make up a config (Flora: one flower,
  not the arrangement).

### Shared chrome

Every workbench ends with the same render sections, after the kernel's own and
always in this order: `output → svg → render → roll → video → overlay`
(`SHARED_SECTIONS`). `sectionsFor` and `usageFor` sort them there, so a
kernel's declaration order cannot change it, and a kernel section must not
reuse one of these ids. The shared knobs have one name everywhere:

- `batch` (`standard.batch`) is the seed that names a batch's generations and
  seeds its rolls. A kernel whose scene calls it `seed` keeps that name for
  presets with `sceneKey: 'seed'`.
- `hold` (`standard.hold`), `fps`, `mode` and their timing live in `video`;
  `margin` lives in `render`.
- `montage` is the video mode that cuts one generation after another (it was
  `stills`, the name the still kind already has).

A renamed key keeps working through `aliases: ['old']` (job JSON, sidecars and
`--old` flags, which `canonicalArgv` rewrites before `parseArgs`), and a
renamed choice through `choiceAliases: { old: 'new' }`; `standard.mode` maps
`stills` to `montage` itself. A scene that builds Leva straight from the specs
reads `SCENE_NAMES` / `SCENE_OPTIONS` so its controls stay in preset key space,
and `sceneNamed(options)` turns render options into scene keys for kernel calls.
`npm run workbench-chrome:check` fails when a workbench breaks the order, uses
an old key, mode or label.

## 2. Scene Leva — `@modules/schemaControls`

`createSchemaFolders({ label, options, keys, folders, open, controls,
collapseGroups })` returns `(saved, extras, top) => folders`. `folders` maps
each section to its Leva folder name in display order; `controls` overrides a
key's input (palette names live outside the dependency-free schema); `extras`
puts buttons before/after a key and `top` at the head of a section. `when`
visibility and `choiceLabels` come from the specs. A scene's
`utils/controls.js` is that call plus its roll function and buttons.

## 3. Workbench page — `src/dev/renderWorkbench/RollWorkbench`

A tool page is configuration:

```jsx
import * as kernel from '@modules/hyperCubes';

<RollWorkbench
  name="HyperCubes"
  noun={{ many: 'structures', one: 'structure' }}
  preview={{ placeholder, scene: 'hyperCubes', stats }}
  schema={kernel}
  sections={{ choices: { paletteName: PALETTE_CHOICES } }}
  title="HyperCubesCLI"
  tool="hyperCubes"
/>;
```

It lays out kind/format/mode, roll and hold, count/width/height, then
`SchemaSections`: views and image-format pickers plus every remaining option
grouped by section. `sections` takes `open`, `choices`, `fields` (custom
controls), `handled` (keys the page lays out itself), `pickers` (checkbox
lists such as families) and `followWhen`. `preview.stats(config, metadata)`
fills the gallery's stats; `controls` and `afterFields` are components for a
tool's own form pieces. The Format picker sets width, height and the
overlay's `ig` safe area together (Post and Square → `post`, Reel → `reel`).
`prepareOptions(chosen, options)` optionally derives the submission payload after
pins are applied, for example to attach the current ghost as a variation base.
`leadingTabs` (an array, or a function of the
page's context — `{ jobsApi, kind, options, pins, setOption, setOptions }`)
and `defaultTab` pass through to `ResultsPanel`, for a live view that reads
and writes the form (GhostBusterCLI's Live tab); a preview with no `scene`
offers no "Save as scene preset". Flora, Trucheterie and Rorschach keep bespoke pages
built from the same parts. `ResultsPanel` takes `leadingTabs` ({ id, label, icon, render })
for a tool with a live view ahead of Saved / Transient / Jobs (PrintShop's
Preview), and `createRenderJobService({ itemFolders: true })` makes each
gallery item its whole folder — keep and delete move every file in it.

## 4. Dev server — `src/dev/server/renderJobs/schemaTool`

`createSchemaToolPlugin({ tool, slug, options, normalizeOptions, kinds,
preset, routes })` serves `/dev-api/<tool>/jobs|saved|presets`. It runs
`scripts/<slug>-generate.mjs` (stills into the job folder) and
`scripts/<slug>-video.mjs` (`<slug>.mp4` and/or `<slug>.webm`: the CLI
writes each ticked format beside the `out` it is given), forwards a rollable option only
when the page sent it (a typed flag is a pin), and keeps curated media in
`public/images/<slug>`. `preset` (`scene`, `base`, `requires`, `name`,
`configFrom`, `presetFromConfig`, optional `value`) writes a generation into
the scene's `PRESETS`; pass `writePreset` instead when the target varies
(Brutalist's stage, ExhibitA's loop-built presets).

## 5. Headless CLIs — `scripts/lib/generatorCli.mjs`

A generator's `scripts/<slug>-generate.mjs` is one `runStills({...})` call and
its `-video.mjs` one `runVideo({...})` call. The drivers own argv and
`--help`, the banner, loading the kernel, the progress bar, the renderer's
lifetime, the frame sink, the sidecars and the exit; the tool supplies only
what it draws.

- `runStills`: `setup(ctx)` returns the batch and roll; `item(ctx)` makes one
  generation — roll it, `save(name, sidecar)` (its folder and `props.json`),
  then `out.image(name, produce)` (every ticked raster format),
  `out.svg(name, text)`, `out.file(name, data)` and `out.eachView(fn)`.
  `gpu(ctx)` skips the renderer for SVG-only batches.
- Plots: every `.svg` a still writes (`out.svg`, or `out.file` with an
  `.svg` name) goes through `writePlot`, so a tool gets these with no code of
  its own:
  - `svgColors` > 0 regroups the plot into that many inks
    (`src/modules/plotKit/inkLayers.mjs`, dependency-free): each shape's own
    stroke (or fill) colour, weighted by its path data, near-duplicates
    (ΔE < 8) folded, then Ward-merged by `samplePalette`
    (`plotKit/palette.mjs`); one layer per ink
    (`pen-20+ ink N #rrggbb`), darkest first, each shape recoloured to its
    ink and carrying the presentation attributes and transforms of the
    groups it left. A first fill-only rect stays as the paper.
  - A mesh opts out of every mesh plot with `userData.plot = false` (a
    ray-marching proxy, GPU-placed vertices); albedo capture copies a node
    material's `colorNode`, `positionNode` and `fragmentNode`, so palette
    attributes, solved membranes and ray-marched fields keep their colour.
  - `plotWidthMm` sets the SVG's physical `width`/`height` in mm, leaving the
    `viewBox` alone. An SVG that already carries a physical size (Kumiko's
    panel, Subdivision's `widthMm`) keeps it, so those tools skip the option.
  - The gallery shows the newest 24 collections (120 items) and pages the
    rest (**Show more**): mounting ~500 at once froze the dev page. Cards for
    SVG-only generations show the cached thumbnail, not the SVG.
  - Plots leave the bench as SVG only. Every SVG in a workbench gallery has
    **Open in Plotterizer** (`plotterHref` in `assetGroups.js`), which hands
    the Plotterizer the SVG, its `props.json` and the tool, so it can map
    layers to pens and re-render the generation at the plot's real size; DXF
    for the cutter is the Plotterizer's (`docs/plotterizer.md`).
- `runVideo`: `plan(ctx)` returns `{ shots, presets() }` (plus optional
  `sidecar()`, `gpu`, `finish(write)`, `cleanup()`); a shot is
  `{ frames, enter?(capturer), frame(capturer, clock), exit?() }` and `frame`
  returns the RGBA to write. `azimuthOffset(options, clock)` is the shared
  turntable/orbit drift.
- `scripts/lib/<tool>Render.mjs` keeps only the tool's capturer and kernel
  steps: `parseCli = createParseCli(schema)`, `loadKernel = () =>
loadKernelModules(ENTRIES)`, `withCapturer` over `withRenderer`, and shared
  `encodeFrame`, `sidecarFor`, `capturerSvg` (depth-pass hidden lines), vector
  helpers and `DEG` from `generatorCli.mjs`.
- Each `headless.readFrame` is one animation frame: `headlessWebgpu.mjs`
  runs three's animation loop by hand, so every read re-renders its passes
  and output never depends on how long a step took. A capture that draws
  outside `readFrame` must call `advanceFrame()` first, or its passes show
  the last frame.
- TSL `time` is the capture clock, not the wall clock: `runVideo` calls
  `setClock(written / fps)` before each frame and stills stay at 0, so
  animated grain, wind and blinks play at video speed. A bespoke video loop
  calls `setClock` itself.

- A generator whose stage is React rather than a three-only rig
  (GhostBuster, BirdsArentReal) mounts it with R3F on the headless renderer:
  R3F loads through Vite (`loadModules(entries, { noExternal: ['@react-three/fiber'] })`)
  so it shares the stage's three, and `renderer.setOutputRenderTarget` makes
  the capture target its canvas. See `docs/ghost-buster-pipeline.md`. The
  pieces such a tool shares:
  - `@modules/renderStage` — `createStageRoot({ Stage, … })` (the headless
    root), GhostBuster's `StudioEnvironment` and `Backdrop`, `ShadowFloor`
    (a shadow catcher), `aimCamera`, `createDepthCapture` (subject-only
    linear depth; `only` takes one object or a list), `createNormalCapture`
    (subject-only view-space normals), `createAlbedoCapture` (subject-only
    flat material colour, for a colour plot's inks), `depthProbe` and `tightRows`.
  - `scripts/lib/r3fHeadless.mjs` — `installTextureLoader` (public/ files
    and a GLB's embedded `blob:` images through sharp) and
    `installGltfLoader` (Draco decoded and WebP re-encoded as PNG with
    gltf-transform, so a stage's `useLoader(GLTFLoader, url)` runs
    unchanged). drei cannot load headlessly, so a model a stage draws loads
    through `@hooks/useDracoGltf` (R3F's `useLoader` with drei's Draco
    decoder path), as FakeBird and StylizedCloud2 do.
  - A Live tab: `src/dev/renderWorkbench/liveCapture.js` (`pngBase64`),
    `src/dev/server/renderJobs/liveCapture.js` (the `POST /captures`
    route) and generatorCli's `readCapture` / `finishCapture` (what
    `runStills` runs for `--capture`).
- `@modules/plotKit` is the three-free plot kit kernels share: `frameSphere`
  and `framePoints` (a camera fitted to a sphere, or to a wide subject's box
  corners), `createProjector`, marching squares, polyline helpers, mesh line
  work (`weldMesh`, `meshEdges`, `sectionCuts`, `chainKeyed`, `traceRuns`:
  contours, creases and section cuts of read-back meshes), colour plots
  (`samplePalette`, `inkMap`, `inkMask`, `composeInks`: a layer per ink,
  fed by renderStage's `createAlbedoCapture`; see
  `docs/dumpster-fire-pipeline.md` § Colour plots), and the
  image-driven layers a plot reads from a render and its depth coverage —
  `meshPlotSvg` (any subject's read-back meshes as hidden-line contours and
  creases, its own world polylines, the render's brightness contours for a
  ray-marched surface, and the silhouette, inked from the albedo — what a
  three-only capturer with no line work of its own plots, through
  `@modules/renderStage/meshPlotter` (`createMeshPlotter(renderer, {
advance })`; the CLI passes headlessWebgpu's `advanceFrame`) and
  renderStage's `readMeshes`; ExhibitA, FractalAutomata, Trucheterie3D), `inkLayers`
  (the `svgColors` pass), `foldClose`,
  `silhouetteRuns`, `shadePath` (crosshatch … tsp), `outlineRuns`,
  `textureRuns` and `plotLayer`/`pathOf` for pen layers.

Rorschach's CLIs predate this and stay bespoke; its stills call
`writePlot(path, svg, plotOf(options))` directly.

## 6. Spinning up a new generator

Confirm with the user first that the scene gets a bench (`docs/scene-conventions.md`
§17), then build to the core requirements in § 0 (roll, video, SVG plot, Live tab).

1. Kernel: `renderOptions.mjs` from the builders and `standard`, then
   `createOptionSchema` with `views`; every look knob rolled, a plot module
   for SVG, a time parameter for video.
2. CLIs: the stage in `src/modules/<tool>Render/stage.js` (§ 0.4),
   `scripts/lib/<tool>Render.mjs` (`parseCli`, `loadKernel`, a capturer
   wrapping the stage on the headless renderer, `withCapturer`) and
   `scripts/<slug>-generate.mjs` / `-video.mjs` as `runStills` /
   `runVideo` calls; npm scripts.
3. Scene: `utils/controls.js` over `createSchemaFolders`.
4. Workbench: `src/dev/tools/<tool>/` with `devPage.config.js`
   (`group: 'render-workbenches'`), the `RollWorkbench` page, its
   `live.js` passed through `liveTabs` (or an R3F `Live<Tool>.jsx`) as
   `leadingTabs`, and `todo.md`; a clean `npm run live:check -- <tool>`;
   add the tool's `.eslintrc.json` block (`docs/dev-tooling.md` §4).
5. Server: `src/dev/server/<tool>/plugin.js` over `createSchemaToolPlugin`,
   registered in `devServerPlugins.js`.
6. Check: `scripts/<slug>-check.mjs` calling `checkWorkbenchPage` from
   `scripts/lib/workbenchPage.mjs` among its drift checks, and a clean
   `npm run workbench-chrome:check`.
7. Overlay (§7): `...standard.overlayOptions()` in the kernel's
   `RENDER_OPTIONS`, `overlay: sceneIconFile('<slug>')` in both CLIs, the tool
   in `OVERLAY_TOOLS`, then `npm run scene-icons` and `npm run overlay:check`.

## 7. Overlay burn-in

Every render workbench can burn the app's overlay chrome (the Reversal mark,
the scene's icon, version, name and date) into its stills and video frames,
so a render posts looking like the app does. It is one mechanism, wired the
same way for every tool:

- **Options.** `...standard.overlayOptions()` in the kernel's `RENDER_OPTIONS`
  declares `overlay` (off for renders), `ig` (the safe-area insets: `story`,
  `reel`, `post` or `none`) and `viewport` (the CSS width the overlay emulates;
  output width over it is the device pixel ratio it draws at). They are
  render options, never scene controls. A scene that has its own toggle names
  it in the argument (`standard.overlayOptions({ default: true, scene: true,
sceneKey: 'showOverlay' })`, as Flora and Fungi do). The workbench page
  shows them as the Overlay section with no page code.
- **CLIs.** A tool's `runStills` / `runVideo` call names the icon its scene
  wears: `overlay: sceneIconFile('<slug>')`. The drivers read the package
  version, composite the overlay onto every frame (`encodeFrame` for stills,
  the frame stamp for video — a held still is stamped once) and leave SVG
  output alone, since the chrome is raster. A video plan that replays frames
  already finished (`plan.overlay: false`) is not stamped twice. Rorschach's
  bespoke renderer calls `overlayLayer` itself, with the same `sceneIconFile`.
- **The icon.** The overlay draws the icon the scene shows in Scenemoji, never
  a hand-drawn copy. `scripts/lib/sceneIcons.mjs` reads the scene's
  `scene.config.jsx` — the react-icons component and the colour it is drawn in,
  or the `iconFile()` image a scene ships — and `npm run scene-icons` writes
  `public/icons/<scene id>.svg` from it. Change a scene's icon, rerun it, and
  commit the SVG. The overlay deliberately leaves out the area icon (the
  wrench on WIP scenes), so a posted image never reads as unfinished work.
- **The check.** `npm run overlay:check` fails when a render workbench is not
  in `OVERLAY_TOOLS`, lacks the three options, does not name its scene's icon
  in a CLI, or has an icon file that no longer matches its scene.
