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

## 1. Declaring options — `@modules/optionSchema`

One way to write a spec. Import the builders from
`../optionSchema/index.mjs` (relative: the file must load in plain Node and
in Vite's config loader, so it stays dependency-free).

| Builder                                                                  | Makes                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `num(section, group, label, value, min, max, step, extra)`               | a scene number control                                                                                                                                                                                                                                                                                                                                      |
| `choice(section, group, label, choices, value, extra)`                   | a scene enum (`choiceLabels` names its choices)                                                                                                                                                                                                                                                                                                             |
| `flag(…)`, `color(…)`, `spec(type, section, group, label, value, extra)` | a scene boolean, colour, or anything else                                                                                                                                                                                                                                                                                                                   |
| `rolled(facet, [min, max] \| null, item)`, `inFacet(facet, item)`        | lets the dice set it (in that window)                                                                                                                                                                                                                                                                                                                       |
| `sceneOnly(item)`                                                        | a scene control that is never a render option                                                                                                                                                                                                                                                                                                               |
| `rigOf({ facet })`                                                       | a builder for light/post rig keys (`rig: true`, section `post`)                                                                                                                                                                                                                                                                                             |
| `output`, `still`, `video`, `render`, `roll`                             | scope/section wrappers for literal render options                                                                                                                                                                                                                                                                                                           |
| `standard.<key>(…)`                                                      | the shared render options: `batch`, `out`, `width`, `height`, `pixelRatio`, `count`, `png`, `webp`, `svg`, `plotWidthMm`, `views`, `svgStroke`, `svgPenMm`, `svgOcclusion`, `samples`, `shadows`, `projection`, `fov`, `margin`, `keep`, `base`, `palettes`, `mode`, `view`, `fps`, `hold`, `turns`, `orbit`, `overlay`, `ig`, `viewport`, `overlayOptions` |

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
`scripts/<slug>-video.mjs` (one `<slug>.mp4`), forwards a rollable option only
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
    (subject-only view-space normals), `depthProbe` and `tightRows`.
  - `scripts/lib/r3fHeadless.mjs` — `installTextureLoader` (public/ files
    and a GLB's embedded `blob:` images through sharp) and
    `installGltfLoader` (Draco decoded and WebP re-encoded as PNG with
    gltf-transform, so a stage's `useLoader(GLTFLoader, url)` runs
    unchanged). drei cannot load headlessly, so a model a stage draws loads
    through `@hooks/useDracoGltf` (R3F's `useLoader` with drei's Draco
    decoder path), as FakeBird and StylizedCloud2 do.
  - A Live tab: `src/dev/renderWorkbench/liveCapture.js` (`pngBase64`),
    `src/dev/server/renderJobs/liveCapture.js` (the `POST /captures`
    route) and `scripts/lib/liveCapture.mjs` (`readCapture`,
    `finishCapture` for `--capture`).
- `@modules/plotKit` is the three-free plot kit kernels share: `frameSphere`
  and `framePoints` (a camera fitted to a sphere, or to a wide subject's box
  corners), `createProjector`, marching squares, polyline helpers, and the
  image-driven layers a plot reads from a render and its depth coverage —
  `silhouetteRuns`, `shadePath` (crosshatch … tsp), `outlineRuns`,
  `textureRuns` and `plotLayer`/`pathOf` for pen layers.

Rorschach's CLIs predate this and stay bespoke; its stills call
`writePlot(path, svg, plotOf(options))` directly.

## 6. Spinning up a new generator

1. Kernel: `renderOptions.mjs` from the builders and `standard`, then
   `createOptionSchema` with `views`.
2. CLIs: `scripts/lib/<tool>Render.mjs` (capturer, `parseCli`,
   `loadKernel`, `withCapturer`) and `scripts/<slug>-generate.mjs` /
   `-video.mjs` as `runStills` / `runVideo` calls; npm scripts.
3. Scene: `utils/controls.js` over `createSchemaFolders`.
4. Workbench: `src/dev/tools/<tool>/` with `devPage.config.js`
   (`group: 'render-workbenches'`), the `RollWorkbench` page and `todo.md`;
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
