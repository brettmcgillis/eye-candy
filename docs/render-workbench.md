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

| Builder                                                                  | Makes                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `num(section, group, label, value, min, max, step, extra)`               | a scene number control                                                                                                                                                                                                                                                            |
| `choice(section, group, label, choices, value, extra)`                   | a scene enum (`choiceLabels` names its choices)                                                                                                                                                                                                                                   |
| `flag(…)`, `color(…)`, `spec(type, section, group, label, value, extra)` | a scene boolean, colour, or anything else                                                                                                                                                                                                                                         |
| `rolled(facet, [min, max] \| null, item)`, `inFacet(facet, item)`        | lets the dice set it (in that window)                                                                                                                                                                                                                                             |
| `sceneOnly(item)`                                                        | a scene control that is never a render option                                                                                                                                                                                                                                     |
| `rigOf({ facet })`                                                       | a builder for light/post rig keys (`rig: true`, section `post`)                                                                                                                                                                                                                   |
| `output`, `still`, `video`, `render`, `roll`                             | scope/section wrappers for literal render options                                                                                                                                                                                                                                 |
| `standard.<key>(…)`                                                      | the shared render options: `batch`, `out`, `width`, `height`, `pixelRatio`, `count`, `png`, `webp`, `svg`, `views`, `svgStroke`, `svgOcclusion`, `samples`, `shadows`, `projection`, `fov`, `margin`, `keep`, `base`, `palettes`, `mode`, `view`, `fps`, `hold`, `turns`, `orbit` |

`group` is the dotted folder path inside the section, or `null`. Every builder
takes `extra` last and spreads it, so any field can be overridden. A kernel
may define named compositions of these (Flora's `gen`, Brutalist's
`forest()`), never its own copies of them.

`createOptionSchema({ options, sectionLabels, surfaceDefaults, views,
configKeys, validate })` returns the CLI/workbench surface (`defaultsFor`,
`normalizeOptions`, `usageFor`, `optionsFor`, `sectionsFor`, `facets`,
`keysInFacet`) and the scene adapters (`SCENE_KEYS`, `LEVA_KEYS`,
`GENERATOR_KEYS`, `keysWhere`, `sceneDefaults`, `configFrom`,
`optionsFromConfig`, `presetFromConfig`, `sceneNameFor`, `resolveViews`).
Re-export what consumers use; don't rewrite them.

- `normalizeOptions` already checks that a still has an image format, that
  width × pixelRatio fits 8192, and (given `views`) that `views` names real
  views. `validate` is only for the kernel's own rules.
- `sectionLabels` lists only labels that differ from the section id.
- `configKeys` narrows which scene keys make up a config (Flora: one flower,
  not the arrangement).

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
tool's own form pieces. Flora, Trucheterie and Rorschach keep bespoke pages
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

Rorschach's CLIs predate this and stay bespoke.

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
   `scripts/lib/workbenchPage.mjs` among its drift checks.
