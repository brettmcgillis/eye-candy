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

## Crown form and structure

Three genes shape a crown, and they came out of measuring a 100-still batch
that read as repetitive (`docs` note: the diagnosis mattered more than the
guesses — two plausible theories were wrong).

- **`crownForm`** names the form the whole plant is built from (`auto` keeps
  the old behaviour, where every head picks its own and a crown ends up an
  average of several). A named form repeats through the crown, with a 35%
  chance per extra form of something else so it does not read as one stamped
  shape. The roll picks `auto` 35% of the time and a named form otherwise.
  Before this, the form was rolled inside `composeForms` and never surfaced:
  you could not ask for a ring flower, hold a form and reroll colour, or
  art-direct one from the workbench.
- **`crownStructure`** (0–1) blends how tips are placed. At 0 every tip is an
  independent uniform draw inside the form's volume — a cloud, which is what
  made every crown read alike. At 1 tips are dealt round-robin into `crownUnits`
  discrete units seated on a lattice the form would really grow on: a
  phyllotactic spiral on an ellipsoid, a Vogel spiral across a bowl's cap (a
  daisy's disc), rays over an umbel's dome, whorls up a cone turned by the
  golden angle, discrete pendulous strands on a weep, beads around a ring.
  Measured effect: tip-spacing CV 0.68 → 1.04, i.e. real clumps with gaps
  between them rather than even fuzz. The fiber clustering then finds those
  clumps and grows visible sub-branches into them.
- **`crownUnits`** is how many units the crown splits into; it does nothing at
  `crownStructure` 0.

`crownStructure` defaults to **0**, so every hand-tuned scene preset renders
exactly as before; the roll uses 0.25–1, so generated flowers get structure.

**What this did not fix.** Structure changes texture and coherence, not
outline. Batch silhouette diversity (mean nearest-neighbour distance over 40
renders) was 0.100 before and 0.092 after — unchanged. The outline is governed
by the form's _volume_, so the next lever is the envelope itself: superformula
silhouettes, profile-driven surfaces of revolution, and shell-vs-fill. Widening
the roll windows is not the lever either: sampling every shape knob across its
full declared range moved the same metric only ~13%.

## Scene camera

The scene opens on **Spline Motion** along the shared `Lateral Arc Sweep` path
(`@presets/spline/cameraSplinePresets`), targeting y=5, orientation `target`,
36s per loop. Orbit is still there as a mode with its own framing.

## Scene controls

The scene mirrors Rorschach's arrangement (`docs/scene-conventions.md` §13):
a **Scene** folder with `showOverlay` and a **Roll** sub-folder, plus an
overlay button bar — Regenerate (a whole new plant), Reseed (same art
direction, new shape), Unravel now, and Pause (which parks `timeScale` at 0
and restores it). Rolling a facet re-rolls only that facet's keys and leaves
the rest of the plant alone, the same facets the CLI holds and rolls. Leva
labels a button by its key, so the roll buttons are keyed by their label.

**`rollGenerations` makes the scene do what the CLI does.** Without it a
regrow loop is the same plant at a new seed (`seed-1`, `seed-2`…); with it
every cycle is a fresh roll of every facet, so watching 100 generations is
equivalent to generating 100 stills. Turning it on — including on mount, so a
reload is not the same flower twice — rolls immediately rather than waiting
out the current cycle, and the roll made for the _next_ generation is
suppressed from swapping the plant currently on screen. The **Wild** preset
switches it on. It is marked `sceneOnly` in the schema: a preset carries it,
no CLI surface offers it, since a render rolls every still anyway.

`overlay` is the one option whose scene control has a different name
(`showOverlay`, as in Rorschach), which is what `sceneKey` is for. **A config
lives in the scene's key space**, so everything crossing between the two goes
through `sceneNameFor` / `optionsFromConfig` — `sceneDefaults()` keyed by the
schema name instead was a real bug: the scene read `showOverlay` and got
`undefined`, so the button bar never appeared.

## Crown against stem

`crownRatio` (default 0.45) is the widest a crown may be relative to its stem,
and it is enforced on the **built envelope**, not on the parameters. Every
attempt to predict the final width from the parameters left a tail of plants
whose crown was as wide as the whole plant was tall: the width is the product
of form sizes and offsets, head count, branching and posture, and each factor
added to the estimate only moved the tail around. The envelope is already
built when it can be measured, so `fitToStem` measures the crown's reach and
scales the tip targets about the **stem top** — which keeps the crown attached
where it grows — with a floor at 0.12 for the opposite case.

Measured over 40 rolls, crown diameter against plant height: worst case
1.36 → **0.72**, median 0.48 → 0.39.

## Branches follow the stem

Heads are placed around the stem by azimuth, and only `fork` and `umbellate`
blended the stem's heading into that direction. `candelabra`, `alternate` and
the side shoots picked a purely horizontal azimuth, so on a leaning stem about
a third of their branches grew back over the plant's own base — which reads as
a crown pointing the opposite way from where the stem was going.
`stemDrift` measures the trunk's lean (base to top, full weight by ~27°) and
biases those three placements with it. On stems leaning more than 14°,
branches growing back against the lean: `alternate` 36% → 6%, `candelabra`
33% → 7%, matching `fork` and `umbellate`, which were already 6–8%. An upright
stem has no drift, so it is unchanged.

Measure a branch from **its own attach point**, not the trunk top: heads
attached partway down a leaning stem sit behind its top by construction, and
measuring from the top reported 97% "backwards" for a placement that was only
36% wrong.

## The botany axis

`botany` runs 0 to 1: 0 is Flora's own free-form growth, 1 is a plant built
the way a real one is, and anything between is a mix. It is a bias on the
parameters and on the dice (`botany.js`), applied after `varyParams` and
before the habit roll — not a separate generator, so every other control keeps
working. The roll uses the full 0–1, so a batch mixes alien and plausible
rather than replacing one with the other; it defaults to 0, so hand-tuned
presets are untouched.

What rises with the axis:

- **One plan instead of an average.** `formCount` is pulled to 1 — measured
  7.5 → 2.8 forms per plant across 0 → 1.
- **Real arrangements.** The form dice are weighted toward inflorescences a
  plant actually makes (umbel, capitulum, spike, panicle) and away from the
  ones it does not: ring and helix fall from 22% of forms to 9%.
- **Arrangement over cloud.** `crownStructure` is pulled to 1, so earthly
  plants get the lattices rather than a spray of random tips.
- **Allometry.** The crown is pulled toward a real fraction of the stem
  (`stemHeight * 0.36`, clamped), with a calmer stem, less warp and asymmetry,
  and fewer wisps.
- **Leaves and an involucre.** Bracts 12 → 18 plants in 24, stem leaves
  8 → 17; tendrils become rarer.
- **Florets rather than dice.** Ornament weights favour petals, hearts and
  spheres (cards 122 → 746 per plant) and wireframe ornaments fade out, since
  a wireframe reads as the alien version of a floret.

Rolling the axis across a batch widens silhouette spread modestly (mean pair
0.376 → 0.419); what it really changes is character, which that metric cannot
see.

**The involucre is capped.** Bracts ran 36–76% of the crown radius, which read
as a second crown rather than a collar. `bractSize` (default 0.18) sets the
fraction, and the reach is clamped to 35% of the nominal crown radius, because
a head often comes out smaller than its parameter and was being swallowed by
its own bracts.

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

## Overlay burn-in

`--overlay` composites the app's overlay chrome into stills and video frames,
the same burn-in Rorschach does and from the same code
(`scripts/lib/overlayLayer.mjs`, cached per geometry). Every caller passes its
own scene's icon explicitly (`icon: 'flora.svg'`, a file in `public/icons/`);
there is no default, so a CLI that forgets it fails instead of wearing another
scene's. `--ig` picks the
safe-area insets and `--viewport` the CSS width being emulated. The overlay is
laid out in CSS pixels against that viewport, so at `pixelRatio` above 1 it
scales with the frame the way it does on a retina screen. It defaults on in
the scene and off for renders (`SURFACE_DEFAULTS`). SVG output carries no
overlay — it is raster chrome.

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
