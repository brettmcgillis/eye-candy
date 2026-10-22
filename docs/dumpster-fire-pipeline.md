# DumpsterFire pipeline

DumpsterFireCLI renders, films and plots the Dumpster Fire scene from rolled
generations, and its Live tab burns one in the page for you to orbit and
capture. It is the BirdsArentReal arrangement
(`docs/birds-arent-real-pipeline.md`): the stage is a **real R3F component
tree** built from the scene's own elements, mounted on the headless WebGPU
renderer by the CLI and in a `<Canvas>` by the Live tab. The WebGL scene
reads the same generation through Leva folders built from the same schema.
Run `npm run dumpster-fire:check` after changing any piece below.

## The shape

```
@modules/dumpsterFire         three-free: option schema, roll, trash / wall / smoke layouts,
        │                       framing, flame-noise mirror, plot
@modules/dumpsterFireRender   DumpsterStage (R3F stage), capture readbacks, and what the
        │                       scene shares with it: SidewalkGround, useCinderblocks,
        │                       FireLights, the fire/smoke authoring, applySmokeGeneration
        │   over @modules/renderStage and @modules/plotKit
        ├─ WebGL/DumpsterFire           Generation folders (utils/controls.js), physics
        │                               items, wall and smoke from the generation
  scripts/lib/dumpsterFireRender.mjs    src/dev/tools/dumpsterFire
    ├─ dumpster-fire-generate.mjs         DumpsterFireWorkbenchPage (RollWorkbench)
    │    stills + plot, or --capture       └─ LiveDumpster (Live tab)
    └─ dumpster-fire-video.mjs                    │ POST /dev-api/dumpsterFire/captures
         burn / turntable               src/dev/server/dumpsterFire → generate --capture,
                                          /presets → the scene's PRESETS
```

| Piece                         | Rule                                                                                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/dumpsterFire`       | **Three-free.** May import only `@modules/flora` (`createRng`) and `@modules/plotKit`. The check enforces it. Owns the scene-space constants (`SCENE_ROOT_POSITION`, the wall coursing, `BLOCK_SIZE`); the scene re-exports them. |
| `@modules/dumpsterFireRender` | The only home of the stage, and of anything the scene and the stage both draw. **No drei**: models load through `@hooks/useDracoGltf`, the environment is renderStage's `StudioEnvironment`.                                      |
| `renderOptions.mjs`           | Every knob, once. Facets `trash`, `wall`, `smoke`, `dumpster`, `stage`, `camera`. Scene keys keep the names the scene's Leva and presets already used (`brickWall*`, `scene*`, `dumpster*LidRotation`).                           |
| CLI-only keys                 | `mood`, `settle`, `viewFrame` and `view*` are generation keys (`config: true`, `scene: false`): rolled, kept in sidecars, never in a scene preset. Camera keys are `view*` because scene keys must not start with `camera`.       |

## A generation

Every default reproduces the authored scene exactly — the check holds it to
33 fixed + 20 loose pieces, the 212-block wall and an untouched smoke path.

- **Trash** (`layoutTrash`): `authored` is the scene's hand-placed litter,
  verbatim (including its degrees-as-radians yaws). `rolled` redraws which
  pieces, how many and where from `trashSeed`, each in an authored **rest
  pose** (its height and tilt) turned by a world yaw (`composeYaw`). Pieces
  scatter round the dumpster weighted by `trashHuddle`, keep their footprints
  apart (flat litter may lie under anything) and stay out of the dumpster;
  the three-box stack moves as one piece (`trashStacks`).
  `dumpsterContents` picks what sits in the dumpster.
- **Wall** (`layoutWall`): the scene's running-bond courses, local to the
  wall group with the bottom course on y = 0. `brickWallCrumble` drops a
  ragged run off the top, `brickWallHoles` knocks out noise patches, and any
  block left with nothing under it falls too; `brickWallRubble` of the fallen
  lie at the foot of the wall. The scene keeps its wall group at
  `brickWallPosition` (y 1, so physics drops it the last metre); the stage
  stands it on the ground.
- **Smoke** (`smokeVisibility`, `bendSmokePoints`): `smokeSystem` picks the
  plume (FireAndSmoke's growing blobs), the particle system as Particle,
  Volumetric or Both, or plume + particles as authored. The path is bent in
  its own frame — mirrored, leaned, stretched, swayed and jittered, all
  growing from the dumpster — on both the plume and the particle smoke; the
  fire is never bent. `applySmokeGeneration` does this to the scene's smoke
  state; the scene skips it while Edit Mode is on, so handles edit the
  authored path.
- **Stage**: the `stage` roll picks a `mood` and sets the scene's light keys
  from it (paper-white day, or the Dark Mode look); a pinned mood steers it.
  Night also lightens the particle smoke and raises the fire light, as the
  Dark Mode presets do.

## The stage and capture

`DumpsterStage` is the scene without physics, camera rig or interaction:
the dumpster (shell and hinged lids, as ArticulatedDumpster places them),
rug, litter (`createPropAsset` / `createTrashAsset` components), the wall as
instanced cinderblocks, the sidewalk, and the scene's FireAndSmoke / smoke
elements (their WebGPU variants) with FireLights. Solid pieces are tagged
`userData.plotObject` (a wall block each via `plotPerInstance`), fire and
smoke `userData.effect` (`fire`, `plume`, `particles`).

- **Determinism.** The particle and flame sims use `Math.random`; the CLI
  swaps in `burnRandom(name)` for the generation, so a still repeats. Particle
  smoke prefills its path headlessly so a few seconds of `settle` show it.
- **Framing** fits what actually burned: after the settle, `measureSmoke`
  takes the live particles and flame blobs (trimmed of strays) and
  `subjectBounds` adds the dumpster and litter. The spline's far end is never
  used — the smoke fades long before it. `viewFrame: dumpster` frames tight on
  the dumpster and lets the smoke leave the frame.
- **Fog** is tuned for the scene's ~13 m establishing camera; `fitFog`
  pushes it back by however much farther the capture camera stands.
- **Trash catalog.** `@modules/trashCatalog` stays drei-free (plain
  components); the instanced shot pools the scene throws live in
  `@modules/trashShots`, and each element's drei `createInstances` pool in a
  sibling `*Instances.jsx`.

## The plot

`renderDumpsterSvg` layers, each projected through the capture camera and
cut by the solids-only depth pass (`svgOcclusion`):

- **Solids** (`readSolids`): section cuts per piece in its own frame
  (`svgStyle`, pen-0), contours (pen-3), creases (pen-5), plus plotKit's
  silhouette (pen-1), shading (pen-2), halo (pen-4) and texture (pen-6).
  The sidewalk is drawn only with `svgSidewalk`, so it never joins the
  silhouette otherwise.
- **Flames** (`readFlames`, pen-7): the fire and plume blobs as contours and
  slices. Their shape comes from a vertex displacement, so each blob's
  icosphere is displaced on the CPU by `noise.js` — a port of three's
  MaterialX `mx_perlin_noise_float` / `mx_fractal_noise_float` — at the
  uniforms it was drawn with. The check renders the blobs alone and requires
  the mirror's silhouette to cover the shader's at IoU > 0.75.
- **Smoke dots** (`readSmokeDots`, pen-8): live particles as stipple, thinned
  by `svgSmokeDots` × their fade. **Flow lines** (`flowLines`, pen-9):
  streamlines wound along each visible smoke path's tube. **Smoke shading**
  (pen-10): plotKit shading of the render with smoke against one without
  (`smokeContrast`), so it reads the same on day and night streets.
- The blobs are drawn without depth, so they hide line work themselves: a
  point inside a nearer blob's disc and behind its middle is dropped — solids,
  dots and flow lines behind the fire and plume vanish as in the render.

## The scene

`utils/controls.js` builds the Scene, Dumpster, Trash, Brick Wall and Smoke
folders from the schema (`createSchemaFolders`), each headed by a Roll
button that rolls that facet with the rest held. `buildSceneItems` turns the
trash layout into rigid-body items; `DumpsterBrickWall` turns the wall
layout into physics blocks. Presets seed every schema key from
`sceneDefaults()`; the workbench's **Save as scene preset** appends a
generation's scene keys to `PRESETS` as `{ ...DEFAULT_PRESET_SNAPSHOT, diff }`.
