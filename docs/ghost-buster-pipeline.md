# GhostBuster pipeline

GhostBusterCLI renders and plots the ghost — `@elements/WebGPU/ghost`'s
GhostCharacter in any GhostBuster skin — from rolled generations, and its
Live tab captures a running ghost you have posed by hand. Unlike the other
generators its look is not a three-only rig: the stage is the **real R3F
component tree**, mounted on the headless renderer by the CLI and in a
`<Canvas>` by the Live tab, so both draw exactly what GhostBuster draws. Run
`npm run ghost-buster:check` after changing any piece below.

## The shape

```
@presets/ghost/ghostSkins   GHOST_SKINS (GhostBuster's preset list), textures, base
        │
@modules/ghostBuster        three-free: option schema, roll, framing, lattice, plot SVG
@modules/ghostBusterRender  GhostStudio (R3F stage), skins, capture readbacks, createStageRoot
        │                                   │
  scripts/lib/ghostBusterRender.mjs   src/dev/tools/ghostBuster
    ├─ ghost-buster-generate.mjs        GhostBusterWorkbenchPage (RollWorkbench)
    │    stills + plot, or --capture     └─ LiveGhost (Live tab)
    └─ ghost-buster-video.mjs                    │ POST /dev-api/ghostBuster/captures
         float / turntable            src/dev/server/ghostBuster → generate --capture
```

| Piece                        | Rule                                                                                                                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@presets/ghost/ghostSkins`  | The one skin library. GhostBuster's preset menu reads it (`presets/scenePresets.js` re-exports it as `SCENE_PRESETS`), and so do this tool and PrintShop. **Add a skin there and every consumer has it** — nothing else to edit.             |
| `@modules/ghostBuster`       | **Three-free.** May import only `@modules/flora` (`createRng`), `@elements/WebGPU/cloth/clothTopology` and `@elements/WebGPU/ghost/ghostRig`. The check enforces it.                                                                         |
| `@modules/ghostBusterRender` | The only home of the stage. `GhostStudio` is GhostBuster's studio as data (its Lightformer cube environment built directly, ambient, spot, orbit light, grid floor) plus the pose wrapper; `ghostProps(skin)` is GhostBuster's prop mapping. |
| `renderOptions.mjs`          | Every knob, once. Facets: `location`, `skin`, `pose`, `camera`. The skin is a `string` option the page and CLI validate against the library, so the schema stays dependency-free.                                                            |

## Headless R3F

`createStageRoot` mounts `GhostStudio` with `createRoot` on the headless
renderer, `frameloop: 'never'`, and steps it with `advance(seconds)`. What
it takes to run the real tree in Node:

- **R3F through Vite.** `loadModules(entries, { noExternal: ['@react-three/fiber'] })`.
  Externalised, Node loads R3F's CommonJS build with its own copy of three;
  its `instanceof THREE.Color` checks then fail and colours are assigned as
  strings — every material renders black. drei is not used: its bundle pulls
  CommonJS dependencies Vite cannot transform, so the studio's
  `<Environment>`/`<Lightformer>`s are rebuilt as `StudioEnvironment`.
- **`extend(THREE)`** from `three/webgpu`; `<Canvas>` does this in the browser.
- **The canvas is the target.** `renderer.setOutputRenderTarget(target)`
  sends every "draw to canvas" (GhostCharacter's Outline always renders the
  frame itself) into the capture target with tone mapping and sRGB applied.
- **Textures** load through a `TextureLoader.load` shim that reads `public/`
  with sharp into a flipped `DataTexture`.
- **Determinism.** A generation is a fresh stage at clock 0 (`key` remount,
  R3F clock reset), mounted inside `act` so `useFrame` subscriptions exist
  before the first step, with TSL `time` (the cloth's wind noise) set every
  settle step. The wind input runs at `useFrame` priority −1, ahead of the
  ghost: subscription order otherwise depends on whether the ghost
  suspended, and a one-frame lag reshapes the drape. The same batch renders
  byte-identically, and a ghost re-rolled alone matches its batch.

## Framing and the plot

The cloth sim's positions are read back from the GPU (`readGhostLattice`)
and carried to world space by the cloth mesh's matrix. `latticeBounds`
gives the sphere round the visible drape, which `frameGhost` fits — azimuth
0 looks at the face. The plot (`renderGhostSvg`) draws UV lines across the
cloth (`rings` round the crown, `spokes`, `grid`, or `mesh`) plus its edges
(marching squares at the material's `alphaTest`, 0.01: hem, eye holes,
tears), cut where the shader cuts:

- the surface is the render mesh itself: a vertex per sim quad (corner
  mean), dead quads dropped, each cell split into the index buffer's two
  triangles; anything above alpha 0.01 is drawn, so the faded rim is cloth;
- edges and folds within two pixels of the silhouette are left to it, so the
  hem is one stroke;
- folds (`svgFolds`, own layer) are where n·v crosses zero on the cloth —
  the lines where it turns edge-on and overlaps itself;
- cutouts are in the **shader's UVs, whose v runs opposite the lattice's**;
- vertices outside the circle never leave the flat rest disk, so they are
  filled from their neighbours before sampling.

The silhouette (`svgSilhouette`, its own layer) is marching squares over
the depth pass's coverage, simplified (closed loops split before RDP) and
smoothed; `svgStyle: none` leaves the silhouette and edges alone. The depth
pass draws the cloth only, so the floor neither hides lines nor joins the
outline. Shading (`svgShading`: `crosshatch`, `halftone`, `stipple`, `squiggle`, `scribble`, `tsp`; its own layer)
reads darkness from the ghost's own render — one minus luma, masked to the
cloth's coverage, bent by `svgShadeGamma` — so it follows the skin, lights
and textures you see. Crosshatch lays up to four hatch directions at
darkness 0.2/0.4/0.6/0.8; halftone draws pen-filled dots (concentric rings)
on a grid turned by `svgShadeAngle`; stipple keeps hashed, jittered points
by darkness, so a plot repeats exactly. The line-drawing styles read tone **equalized** over the ghost's own
pixels (each darkness becomes its rank), so a pale skin's folds spread
across the whole range rather than crowding under its black eye holes, and
they lift the pen in the highlights. Squiggle draws one wave per row whose
height and frequency follow tone; scribble drags a circling pen along each
row, so shadows coil into loops; tsp is one unbroken line — a
nearest-neighbour tour through tone-weighted stipple (at most 16k points),
uncrossed by neighbour-list 2-opt.

The outline layer (`svgOutline`, pen-4) is the skin's Outline post effect
as lines: an exact distance transform of the coverage mask, with iso-lines
at the band's outer edge (`outline`), every stride across it (`rings`), or
crowding toward the silhouette (`glow` and the pattern modes), measured
inward for `outlineInside`. Widths are drawing-buffer pixels, as Outline's
own are; `svgOutlineWidth`/`svgOutlineStride` override them in output px. Hidden lines go through a linear-depth pass (`createDepthCapture`); note
WebGPU readbacks pad every row to 256 bytes **except the last**.

## The Live tab

`LiveGhost` mounts `GhostStudio` in the page with the form's generation:
Space pauses (frameloop `never`; orbiting re-renders at the frozen clock),
WASD gusts, the cursor pokes the cloth, F frames the drape, and **Use this
camera** writes the orbit back as camera keys. Capture renders the frozen
frame at the form's size into an offscreen target and the plot from the
same readbacks, then posts them to `/captures`; the server stages them and
queues `ghost-buster-generate --capture <dir>`, which finishes the capture
like any still (formats, overlay, sidecar) without a renderer.

## Adding a location

`location` is a facet with one choice (`blank`) today. A location is a
component `GhostStudio` mounts beside the ghost for its choice, plus its
keys in the schema; the All My Friends Are Ghosts settings are the planned
ones (see the tool's `todo.md`).
