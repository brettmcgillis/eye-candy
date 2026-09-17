# Flora pipeline

Flora follows the Rorschach arrangement (`docs/rorschach-pipeline.md`): one
kernel, two renderers, and a dev tool that is a UI over one of them. Its rules
apply here unchanged — change the kernel first, land every consumer in the same
commit, never special-case one renderer. This file records what is specific to
Flora.

## The shape

```
@modules/flora         the generator: specimen, roll, lifecycle, bouquet, option schema
@modules/floraRender   the look: instanced fields, TSL materials, uniforms, palette, lights, rig
        │                              │
  WebGPU/Flora scene          scripts/lib/floraRender.mjs
  (R3F, Leva)                   ├─ flora-generate.mjs   stills + bouquets
                                └─ flora-video.mjs      lifecycle / growth / turntable / stills
                                        │
                     src/dev/server/flora → src/dev/tools/flora (FloraCLI)
```

| Piece                  | Rule                                                                                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/flora`       | **Three-free.** It runs in the scene's Web Worker and in plain Node. No `three`, React, Leva, `node:*` or `@utils` (the gradient JSON). `flora:check` enforces it.                                       |
| `@modules/floraRender` | The only home of the flower's materials. The scene and the CLI both draw with it, so there is no "must stay in step with" copy the way Rorschach's `gpuCapture.mjs` has one.                             |
| `renderOptions.mjs`    | Every knob, declared once: generator params (`generator: true`), scene controls (`scene: true`) and headless-only render settings. `DEFAULT_PARAMS` and the scene's preset defaults are derived from it. |
| The scene's Leva files | Still hand-written (labels, folders). `npm run flora:check` holds their keys, ranges and defaults to the schema in both directions.                                                                      |
| FloraCLI               | Builds its whole form from `sectionsFor()`; a new option appears there with no page change. It never reads the scene — it only writes a generation into the scene's `SNAPSHOTS`.                         |

## Rolling

Three facets — `form`, `palette`, `ornaments` — each on its own RNG stream
(`formSeed`, `paletteSeed`, `ornamentsSeed` override one). A spec with a `roll`
window is rolled inside it; the palette facet also rolls a coherent colour set
from one base hue and sometimes a named gradient (the CLI passes the names in,
since the kernel cannot import the JSON). Lifecycle, wind, strands and surface
carry no facet and hold still across a batch.

Same rule as Rorschach: a typed flag, or a pinned workbench field, is held;
everything else is rolled. `--keep form,palette` holds whole facets and
`--base props.json` starts the roll from a generation. Every _scene_ key that is
typed applies, rollable or not — `--growSeconds 4` shortens a lifecycle clip.

A batch's seeds follow the scene's regrow loop: `seed`, `seed-1`, `seed-2`…,
so flower N of a batch is the plant the scene would grow on cycle N.

## Resolution

`pixelRatio` (default 2) multiplies the output size, and the minimum stroke
widths (`minPixels`, `ornamentMinPixels`) scale with it, so a 2x still is the
1x still with more detail rather than the same picture drawn with finer
fibers. `width × pixelRatio` must stay within 8192, the texture limit.

## Bouquets

`arrangeBouquet` borrows from how bouquets are actually built. Every flower
stays rigid: it turns about its own axis, swings its head onto a target
direction about the tie point, and slides down its own stem — a shorter cut —
so the stems keep passing through the tie. Each flower keeps its own rig, its
own uniforms and its own palette.

| Style     | What it is                                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dome`    | A round hand-tied posy (Biedermeier). Heads sit in a shallow band about the tie; each crown claims a share of the dome proportional to its own area, then a relaxation pass separates them.             |
| `fan`     | A one-sided triangle facing the front camera: longest stem centred, stems stepping down toward the sides, and a shorter staggered row in front once a row fills the cone.                               |
| `ikebana` | Sogetsu basic upright: shin, soe and hikae at 1 : ¾ : ½ of the shin, leaning ~12°, 45° and 75°, all rising from a single point (the kenzan, so `tie` is ignored), with the rest as short jushi fillers. |

**Spacing is by the crown's dense core, not its outermost tips.**
`specimen.crownRadius` is the 75th percentile of tip distance from the crown
centroid, so thin edges interleave the way cut flowers do; `bouquetGap` opens
or closes that further.

**The tie is a lever, and it is lowered automatically.** Tied up among the
crowns, a head is barely further from the pivot than it is wide, and no
arrangement can separate anything — the first version put six flowers in one
heap for exactly this reason. The tie is clamped so every head keeps a lever
at least ~2.2 crown radii long.

These flowers have crowns about as wide as their stems are long, so a large
`fan` still overlaps: the cone runs out of arc. `dome` handles a crowded
bouquet best, `ikebana` is sparse by design.

Sources are generation sidecars: a still's `props.json` contributes its flower,
a bouquet's contributes all of its flowers. `bouquetSize` pads past the
sources, either repeating them at new seeds or rolling new flowers. The
workbench passes sidecar URLs; the dev server reads them and writes
`bouquet.json` beside the output, which is also the bouquet's recipe.

A bouquet cannot be saved as a scene preset: the scene grows one specimen.

**Rotated flowers need model-aware shading.** The materials build positions in
the flower's own space; normals go through `modelNormalMatrix` and the
min-pixel clamp through `modelWorldMatrix`. With an identity transform (the
scene) both are no-ops. Seed flight (`scatterDir`) is still in local space, so a
leaning flower's seeds drift along its own axis.

## Headless rendering

`createFloraCapturer` mirrors `WebGPUCanvas.jsx`: ACES tone mapping and PCF
soft shadows, a `RenderPipeline` scene pass with MSAA, no post chain (the scene
has none). Lights come from `createSceneLights` in `@modules/lightingRig`, the
imperative twin of `<LightingRig>`, fed the same `FLORA_LIGHTING` declaration.
The key light and its shadow frustum are moved to the drawn bounds, since the
declaration is sized for one flower at the scene's crown.

`framing: fit` frames the bounds at the requested view; `framing: scene` uses
the scene camera's target at `distance`. Views are `front`, `right`, `back`
and `left` — a flower reads the same from above or below, so it needs nothing
like Rorschach's four axes.

## SVG, and why not three-edge-projection

A flower is line work already: every fiber, stem rib and wireframe ornament is
a polyline in the specimen. `renderSvg.js` projects those centrelines, which
is what a pen wants — one stroke per fiber. Projecting the tube _meshes_
instead (three-edge-projection) would trace two silhouette edges around every
fiber, at a few hundred thousand tubes of twelve triangles each, to produce
outlines nobody wants to plot.

Hidden line work is removed against a depth map from the real renderer
(`captureDepth`), so what the plot omits is exactly what the render hides. On
a default flower this drops about two thirds of the line work (74.7k paths to
27.1k) with no visible change. `--no-svgOcclusion` keeps everything.

- **Linear depth, two channels.** `getLinearDepthNode()` carries the pass's own
  camera uniforms; a hand-normalised `getViewZNode()` read back a constant.
  One 8-bit channel quantises coarser than a fiber is thick, so depth is split
  across two, and the camera frustum is wrapped around the drawn bounds.
- **Colour is flat per layer** (stem, crown, accent, tip, ornament), each an
  SVG group, because the output is pens: the scene's per-vertex blend has no
  plotter equivalent. With a palette, each layer takes its own stop.
- Solid ornaments plot as silhouettes (the convex hull of their projected
  vertices, tumbled by a CPU mirror of the GPU's PCG hash); cards plot as their
  outline; wireframe ornaments are already fibers.

### Known divergences

| Difference                 | Why                                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Wind is wall-clock         | TSL `time` advances with real time, not clip time. Wind ships disabled; a windy video will not be smooth.      |
| Lifecycle clips never swap | Each item is its own full cycle; the scene's "regrow the current plant if the next isn't ready" never applies. |
| Stills are always settled  | `--growth` / `--bloom` pick a stage; exit is 0.                                                                |

### Traps already hit

- **A hemisphere light's direction is its position.** The lighting
  declaration resolves every slot's position, including the hemisphere's
  `[0,0,0]`; applying it normalised to NaN and every lit material rendered
  black while unlit ones drew fine. `<LightingRig>` never set it, so
  `createSceneLights` doesn't either.
- **Dawn keeps the process alive.** The CLIs end with `process.exit()`.

## Definition of done

- `npm run flora:check`
- `npm run lint:fix`
- `npm run flora:generate -- --count 1 --width 512 --height 640`
- The scene still renders in the browser (human eyeball).
