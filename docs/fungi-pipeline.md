# Fungi pipeline

Fungi follows Flora's arrangement (`docs/flora-pipeline.md`): one kernel, two
renderers, and a dev tool that is a UI over one of them. Change the kernel
first, land every consumer in the same commit, and run `npm run fungi:check`.
This file records what is specific to Fungi.

## The shape

```
@modules/fungi         the generator: genome, profiles, cluster, mycelium, lifecycle, roll, option schema
@modules/fungiRender   the look: createSpecimenRig, materials, lights, camera, post
        │                              │
  WebGPU/Fungi scene          scripts/lib/fungiRender.mjs
  (R3F, Leva)                   ├─ fungi-generate.mjs   stills
                                └─ fungi-video.mjs      lifecycle / growth / turntable / stills
                                        │
                     src/dev/server/fungi → src/dev/tools/fungi (FungiCLI)
```

| Piece                  | Rule                                                                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/fungi`       | **Three-free.** Runs in the scene's worker and in plain Node. It may import `@modules/flora`'s barrel (`createRng`), nothing that renders. `fungi:check` enforces it. |
| `@modules/fungiRender` | The only home of the look. `createSpecimenRig()` is the one object both the scene and the CLI draw with.                                                              |
| `renderOptions.mjs`    | Every knob, declared once: generator params, scene controls, render and video settings. Facets: `form`, `cluster`, `palette`.                                         |
| The scene's Leva files | Hand-written; `fungi:check` holds keys, ranges and defaults to the schema both ways.                                                                                  |

## The specimen

A generation is fruiting bodies (one, a clump, a small troop, or a bracket
rosette) over their own bare mycelium, presented Flora-style in a void. The
kernel emits, per member, 8 growth keyframes and a rotted frame of every
profile curve, with **the same point counts in every frame**. That invariant
is what the renderer depends on.

## Variety

The gene space is the lever for "near infinite": every archetype carries every
gene, so a hybrid can inherit any of them.

- **21 archetypes over 5 plans.** Agarics (amanita, bolete, chanterelle,
  inkcap, parasol, mycena, hedgehog), brackets (bracket, turkeytail, mazegill,
  oyster), puffball-plan (puffball, basket), morel-plan (morel, stinkhorn),
  cup, and the slime-mould `sporangium` plan (stemonitis, arcyria, physarum,
  lycogala, trichia). Archetypes may hint a habit (`colony`, `rosette`,
  `troop`) and a mycelium style (Physarum's yellow `mat` with a `net`).
- **Surface genes** (`SURFACE_GENES` in `archetypes.js`): lattice, beads,
  zonation, maze, capillitium, jelly, gloss, indusium. They are **not
  mutated** like shape genes. Hybrids blend them from both parents, and the
  alien end switches on one to three at random; switching on all of them read
  as noise.
- **Palette hue drift scales with `1 − mycology`**, so field-guide specimens
  keep field-guide colours; zone colours step off the cap's own lightness so
  bands always read.
- **`relax.js`** leans clump members apart (and slides troop/colony bases)
  until mature caps clear each other. It never touches geometry, so keyframes
  stay valid; about 0.5% of pairs in dense colonies stay close.
- **Root blending**: cords root on the stipe surface above the soil line, the
  stipe base fades into the mycelium colour (`basal`), a felt of fibres grows
  at the base, and clumps/colonies/rosettes share a basal pad that grows in
  with the mycelium.

## The rig

- Caps, gills, pores, stipe, veil and volva are built once per keyframe and
  folded into **absolute morph targets** (`morphTargetsRelative = false`); a
  frame sets 9 influences and the GPU blends. Nothing is rebuilt mid-cycle.
- Colours and shape numbers are **uniforms** (`createMemberUniforms`), so every
  generation reuses the same compiled pipelines.
- Lattice, zones and maze are shader patterns over the lathe's `(theta,
along)` attributes, which ride with the flesh through every morph; the
  lattice is a `maskNode`, which three also applies to the shadow pass.
- Warts, scale flakes, stem hairs, beads, capillitium, basal felt and spores
  are instanced. Spores move every frame; the rest are re-placed from the
  CPU-blended profile on quantized growth steps (1/90), which is what keeps a
  rosette's update near 10 ms. The mycelium's
  segments are sorted by growth time, so a level is a live-count prefix.
- **Every instanced layer uses `StorageInstancedBufferAttribute`.** Layers grow
  from zero, and three binds `instanceMatrix` as a uniform whenever the live
  count fits 64 KB while binding the whole capacity. Past 1024 instances the
  mesh then fails silently (the first lifecycle video rendered only pins).
- `load` fits the specimen's box into `fit` (centre `[0, 5.5, 0]`, largest
  side 10.4), so the scene camera never has to reframe and the CLI frames that
  box.

## Lifecycle

`mycelium → fruit → hold → spore → rot → unravel → rest`. Pins knot at 60% of
the mycelium's spread, and members start in age order (`stagger`).
`specimenLevels(config, specimen, t)` is the one clock, shared by the scene and
`fungi:video`. The scene's cycle machine keeps Flora's rules: never wait on a
build, and regrow the current specimen if the next isn't ready.

## Glow

Bloom runs only above a threshold of 1.0: the scene uses PostRig with
`FUNGI_POST`, and the CLI uses `createSpecimenPost`, whose strength follows the
specimen's glow gene.
