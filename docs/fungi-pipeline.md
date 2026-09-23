# Fungi pipeline

Fungi follows Flora's arrangement (`docs/flora-pipeline.md`): one kernel, two
renderers, and a dev tool that is a UI over one of them. Change the kernel
first, land every consumer in the same commit, and run `npm run fungi:check`.
This file records what is specific to Fungi.

## The shape

```
@modules/fungi         the generator: genome, plans, emitter, cluster, lifecycle, roll, option schema
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

Fungi are made of packed hyphae, and the specimen is built the same way: every
part is **fibres** (polylines drawn as instanced lit tubes, Flora-style) plus
instanced beads. Texture comes from the density and direction of the lines,
never from a surface texture. There is no mycelium: the body stands alone in
the void.

- `emit.js` is the one writer. `fiber(points, opts)` takes local-space points
  and per-point `radius`, `aspect`, `color`, `born`, `sag`, `occlusion`; its
  frames are rotation-minimising unless `up` pins the wide axis, which is what
  makes a tube a **plate** (gills, ridges, honeycomb walls).
- `color` is a position on the specimen's five-stop gradient (0 = stem foot,
  1 = outermost tip), not a colour. Plans map their parts onto that axis, so a
  palette is five hex stops.
- `sag` and `born` are per point, never per segment: per-segment values tear
  fibres apart at the joints when they droop or grow.
- A generation is one or more **members** built in their own frame (+Y up) and
  placed by `memberTransform`; `detail` scales fibre counts so a lone specimen
  packs lines tighter and a clump stays inside `MAX_SEGMENTS`.

## Plans

| Plan        | Archetypes                                                   | Built from                                                                                                                                                                                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agaric`    | amanita, mycena, parasol, inkcap, bonnet, lattice, stinkhorn | Stem = two staggered layers of fibres sized to the local stem radius, laid on a curved `stem.js` centreline, flowing into the cap underside. Cap = hierarchical radial fibrils (pleats, wrinkle), a vein **lattice**, or the stinkhorn's pitted `gleba`. Gills = plates. Ring, volva, warts, scale tufts, hanging fringe with bead tips, indusium. |
| `fan`       | fan, funnel, honeycomb, reticulum                            | Curved stalk + flabellate lobes (or a funnel). Face = forking gill ridges (split gill), a walled pore net (honeycomb), or a free vein net with a bead crust.                                                                                                                                                                                       |
| `sporangia` | stemonitis, arcyria                                          | A tuft of hair-thin stalks from one foot, each carrying a capsule or egg of unrolled capillitium net packed with held spores. No hypothallus.                                                                                                                                                                                                      |
| `reaction`  | bloom, terrace                                               | A CPU Gray-Scott field. `bloom` = stacked, ruffled, lobed shelves whose tops step down in terraces along radius contours bent by a maze field. `terrace` contours the growth front's arrival time into lobed rings (lichen).                                                                                                                       |
| `coral`     | coral                                                        | A branching coral (Ramaria / Clavulina): a trunk forking in turned planes towards the light, every branch a two-layer fibre bundle emerging from the core of its parent; crested or pointed tips.                                                                                                                                                  |

`network.js` is the shared reticulate generator: anisotropic Poisson points
over an `(s, θ)` domain, a relative-neighbourhood graph, and a shortest-path
tree from the inner edge whose flow thickens veins towards the source.

Gray-Scott parameters, measured on this solver (128 grid, speckled disc seed):
0.037/0.06 grows worms and 0.042/0.061 a branching maze — `bloom` uses the
former. `terrace` wants a plain spreading front from a few round seeds, so it
keeps 0.0545/0.062 (0.046/0.063 is slower and narrower). Mitosis
(0.0367/0.0649) dies from a single seed.

## Form rules

These came out of review and hold for every plan:

- **Nothing is straight.** Stems and stalks run along `stem.js`: a curve that
  leaves its foot leaning towards its head, straightens as it rises, and
  carries an S-bend (`sway`) and slow wander (`wobble`).
- **Many stems, one foot.** Every multi-member habit grows from one shared foot;
  `clump` is tight and `troop` splays wider. Sporangia stalks share one foot
  too.
- **Nothing passes through anything.** `layout.js` holds each member as a stem
  plus a cloud of head spheres (cap, gills, fringe, veil, lobes) and moves only
  the heads' tops until no two bodies touch. A member that cannot be laid clear
  is shrunk, and dropped last. Fan lobes fan apart in rise around one hinge, so
  they only meet at the stalk; bloom tiers are lifted by a measured clearance;
  coral branches that would collide are swung round or dropped.
- **Dangling parts stay short.** Fringes and the indusium hang at most 0.42 of
  the stem's height.

## Variety

- **`mycology`** (1 = field guide) drives hybridising with another archetype of
  the same plan, gene jitter, and the **alien switches** in `archetypes.js`
  (lattice caps, fringes, pleats, twist, spikes…), one to three at the alien end.
- Field-guide palettes are real species colour runs; the alien end rolls a hue
  walk with a pale or complementary tip. Reaction plans lean alien.
- Habit: `solitary`, `clump` or `troop` — both of the latter from one foot.

## The rig

- Three persistent layers written in place on `load`: instanced fibres,
  instanced beads, and one solid surface mesh (no plan emits a surface today),
  all sharing the same lifecycle uniforms and gradient; the last instance is
  never born so both pipelines compile at mount.
- Lifecycle is entirely uniforms: `grow`, `rot`, `spore`, `exit`, `stagger`.
  Each segment carries its member's `delay`, so a clump grows and rots in age
  order on the GPU. Fibres extend by `born`; rot droops by `sag`, shrinks and
  browns; spores are beads that fall during the spore phase. A **held** bead
  (`BEAD_KIND.held`) is structure until then — a sporangium's spore mass is
  visible from the moment it grows and only falls when the phase comes.
- `load` fits the specimen's box into `fit` (centre `[0, 5.5, 0]`, largest
  side 10.4), so the scene camera never has to reframe and the CLI frames that
  box.

## Lifecycle

`grow → hold → spore → rot → unravel → rest`. `specimenLevels(config,
specimen, t)` is the one clock, shared by the scene and `fungi:video`. The
scene's cycle machine keeps Flora's rules: never wait on a build, and regrow
the current specimen if the next isn't ready.

## Glow

Bloom runs only above a threshold of 1.0: the scene uses PostRig with
`FUNGI_POST`, and the CLI uses `createSpecimenPost`, whose strength follows the
specimen's glow gene. Emissive is the fibre's own colour × its glow weight.
