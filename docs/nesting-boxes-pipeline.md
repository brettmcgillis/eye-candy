# Nesting Boxes pipeline

Nesting Boxes follows Block Party's arrangement (`docs/block-party-pipeline.md`):
one kernel, two renderers, and a dev tool that is a UI over one of them.
Change the kernel first, land every consumer in the same commit, and run
`npm run nesting-boxes:check`.

## The shape

```
@modules/nestingBoxes        CPU tree mirror, motion (grow clock, drift), colour pens,
                             facet roll, plot SVG, option schema
@modules/nestingBoxesRender  tree compute kernel, box material (colour, surface,
                             windows), fog, createBoxRig, camera/lighting/post
        │                              │
  WebGPU/NestingBoxes scene     scripts/lib/nestingBoxesRender.mjs
  (R3F, Leva generated)           ├─ nesting-boxes-generate.mjs   stills + plot SVG
                                  └─ nesting-boxes-video.mjs      grow / loop / drift / turntable
                                        │
          src/dev/server/nestingBoxes → src/dev/tools/nestingBoxes (NestingBoxesCLI)
```

| Piece                         | Rule                                                                                                                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@modules/nestingBoxes`       | **Three-free.** May import only `@modules/flora` (`createRng`) and `@utils/paletteStops`. `nesting-boxes:check` enforces it.                                                                                       |
| `@modules/nestingBoxesRender` | The only home of the look. `createBoxRig()` is the one object the scene and the CLI draw with: `apply(config, { drift, progress })`, then `compute(renderer)` before the frame renders.                            |
| `renderOptions.mjs`           | Every knob, once. `section` is the Leva top folder, `group` the folder path inside it (`Drift.Placement`), `when` hides a control until other keys hold listed values. Facets: `structure`, `color`, `atmosphere`. |
| Rig keys                      | `light*` / `post*` keys are declared with `rig: true`; their defaults must equal `lighting.js` / `post.js`.                                                                                                        |
| Windows                       | Unfinished, so every `window*` key is `sceneOnly`: a scene control with no CLI flag or workbench field, and the roll always sets `windowsEnabled: false`.                                                          |

`growMode`, `growProgress`, `growLoop` and `growNewSeed` are also `sceneOnly`:
they drive the scene's own clock, and the video modes replace them.

## The tree

The tree is a heap: node `id`'s children are `2id` and `2id + 1`. The GPU
kernel (`treeCompute.js`) re-walks each node's root path in one dispatch; the
kernel's `tree.js` walks down level by level with the same arithmetic,
including `wrappedAngle`'s uint wrap. That is exact up to float32, and
`nesting-boxes:check` reads back a level-12 tree under drift from Dawn and
fails if the two ever differ by more than 1e-4 of the root size. Change the
two together.

The stills, the framing and the SVG all use the CPU tree, so a mismatch shows
up as a plot SVG that doesn't match the PNG.

## Roll

`rollNestingBoxesConfig(batchSeed, { base, keep, palettes, pinned })` rolls
each facet on its own `${seed}:${facet}` stream:

- **structure** has the windows the scene's old Randomize button used (seed,
  child scale, jitter, frequencies and phases). The scene's Randomize button
  is now this facet roll.
- **color** covers mode (palette / tint / solid), palette, source, repeat,
  shift, the tint waves and identity level.
- **atmosphere** is one mood: backdrop hue and lightness, fog as that backdrop
  seen through haze, a sky light leaning to the backdrop's hue, a warm or
  cool key, the surface material and weathering, and bloom. Night moods keep
  a stronger key because without windows nothing else lights the tree.

## Backdrop

`backdrop` (a render option) sets the background whenever the atmosphere
facet rolls:

- `contrast` (default): black, unless a render of the settled tree on black
  shows the boxes too dark (mean linear luminance of the box pixels under
  `DARK_BOX_LUMINANCE` = 0.01 in `scripts/lib/nestingBoxesRender.mjs`), in
  which case white with fog off. Only a render can tell: night lights, dark
  stone and wood, and fog fading to black all darken the boxes, and an
  estimate from the palette and surface missed most of them.
- `black`: always black.
- `rolled`: the mood's own colour (the scene's own rolls use this).

The fog colour follows a black backdrop. A set `background` (a typed
`--background`, or pinned in the workbench) overrides every backdrop, and
fog follows it unless `fogColor` is set too. Backgrounds go through the
scene's ACES tone mapping like every other colour, so `#ffffff` renders at
about 90% grey.

## Outputs

- **Stills**: views `hero` (the scene camera's bearing and 23° elevation),
  `front`, `right`, `back` and `left`. A perspective camera at `fov` is
  pulled back until the settled leaves' bounds fit inside `margin`. The fog
  band moves by how much farther the fitted camera is than the scene's, so
  the haze on the tree matches. Tone mapping is ACES and shadows are PCF
  soft, as on the scene's canvas. The post chain is the scene's own
  `createPostChain`.
- **Video**: `grow` (the root box splits at `growLevelSeconds` per level,
  then holds for `hold`), `loop` (one whole grow → hold → shrink → rest
  cycle per tree, so consecutive trees meet on the root box), `drift` (a
  settled tree with drift forced on for `hold` seconds) and `turntable`
  (`turns` per `hold`). Growing clips frame the bounds of every level, so
  nothing leaves the frame. Moving cameras frame the bounding sphere, so
  the zoom never breathes. Drift runs in every mode where the config has
  it on.
- **Plot SVG**: every settled leaf box's twelve edges through the same
  camera, sampled in world space and projected with perspective. Hidden
  lines are dropped against the render's linear depth pass. Boxes under
  0.75px are skipped. A pen is the box's material colour before texture
  and light: a palette snaps to its nearest stop, and tint or solid colours
  are clustered to at most six pens. One Inkscape layer per pen, with no
  background.

## Definition of done

- `npm run nesting-boxes:check`
- `npm run lint:fix`
- `npm run nesting-boxes:generate -- --count 1 --svg`
- `npm run nesting-boxes:video -- --count 1 --pixelRatio 1 --hold 2`
- The scene still renders in the browser (human eyeball).
